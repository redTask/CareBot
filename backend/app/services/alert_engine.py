"""Alert engine — threshold rules, trend rule, deduplication, low-quality handling."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session, joinedload

from app.core.timeutils import iso_z
from app.models.alert import Alert
from app.models.care_plan import CarePlan
from app.models.patient import Patient
from app.models.robot import Robot
from app.models.task import Task
from app.models.vital_reading import VitalReading
from app.services.audit import log_action
from app.ws.manager import manager

# Default thresholds (doctors can override per patient via CarePlan)
DEFAULT_THRESHOLDS = {
    "heart_rate": {"min": 50.0, "max": 120.0, "critical_min": 40.0, "critical_max": 140.0},
    "spo2": {"min": 92.0, "max": 100.0, "critical_min": 90.0, "critical_max": 100.0},
    "temperature": {"min": 36.0, "max": 38.0, "critical_min": 35.0, "critical_max": 39.0},
}

# Vital type -> display label
VITAL_LABELS = {
    "heart_rate": "Heart rate",
    "spo2": "SpO\u2082",
    "temperature": "Temperature",
}

VITAL_UNITS = {
    "heart_rate": "bpm",
    "spo2": "%",
    "temperature": "\u00b0C",
}


def _get_thresholds(db: Session, patient_id: int) -> dict[str, dict[str, float]]:
    """Return thresholds for a patient, merging defaults with CarePlan overrides."""
    thresholds = {k: dict(v) for k, v in DEFAULT_THRESHOLDS.items()}
    care_plan = db.query(CarePlan).filter(CarePlan.patient_id == patient_id).first()
    if care_plan and care_plan.thresholds:
        for vtype, overrides in care_plan.thresholds.items():
            if vtype in thresholds:
                thresholds[vtype].update(overrides)
    return thresholds


def _status_for_value(
    vtype: str, value: float, thresholds: dict[str, dict[str, float]]
) -> str:
    """Return 'normal', 'watch', or 'critical' for a single reading."""
    thr = thresholds.get(vtype)
    if not thr:
        return "normal"
    if vtype == "spo2":
        if value < thr["critical_min"]:
            return "critical"
        if value < thr["min"]:
            return "watch"
        return "normal"
    if value < thr["critical_min"] or value > thr["critical_max"]:
        return "critical"
    if value < thr["min"] or value > thr["max"]:
        return "watch"
    return "normal"


def _find_open_alert(
    db: Session, patient_id: int, alert_type: str
) -> Alert | None:
    """Find an open alert for the same patient and type (for deduplication)."""
    return (
        db.query(Alert)
        .filter(
            Alert.patient_id == patient_id,
            Alert.type == alert_type,
            Alert.status == "open",
        )
        .first()
    )


def _create_alert(
    db: Session,
    *,
    alert_type: str,
    severity: str,
    patient_id: int | None,
    robot_id: int | None,
    message: str,
    current_user_id: int | None = None,
) -> Alert:
    alert = Alert(
        type=alert_type,
        severity=severity,
        patient_id=patient_id,
        robot_id=robot_id,
        message=message,
        status="open",
        escalation_level=0,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Broadcast live
    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            manager.broadcast(
                {
                    "type": "alert_created",
                    "data": {
                        "id": alert.id,
                        "type": alert.type,
                        "severity": alert.severity,
                        "patient_id": alert.patient_id,
                        "robot_id": alert.robot_id,
                        "message": alert.message,
                        "status": alert.status,
                        "escalation_level": alert.escalation_level,
                        "created_at": iso_z(alert.created_at),
                    },
                }
            )
        )
    except RuntimeError:
        pass

    # Audit entry
    try:
        log_action(
            db,
            action="alert_created",
            entity="alert",
            details={
                "alert_id": alert.id,
                "type": alert.type,
                "severity": alert.severity,
                "patient_id": alert.patient_id,
                "message": alert.message,
            },
            user=db.query(User).filter(User.id == current_user_id).first()
            if current_user_id
            else None,
        )
    except Exception:  # noqa: BLE001
        pass

    return alert


def _update_alert_severity(db: Session, alert: Alert, severity: str) -> None:
    """Update severity of an existing open alert and broadcast."""
    alert.severity = severity
    db.commit()
    db.refresh(alert)

    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            manager.broadcast(
                {
                    "type": "alert_updated",
                    "data": {
                        "id": alert.id,
                        "type": alert.type,
                        "severity": alert.severity,
                        "patient_id": alert.patient_id,
                        "robot_id": alert.robot_id,
                        "message": alert.message,
                        "status": alert.status,
                        "escalation_level": alert.escalation_level,
                        "created_at": iso_z(alert.created_at),
                    },
                }
            )
        )
    except RuntimeError:
        pass


def process_vital(
    db: Session,
    reading: VitalReading,
    current_user_id: int | None = None,
) -> list[Alert]:
    """Process a new vital reading: threshold + trend rules.

    Returns list of alerts created/updated.
    Low-quality readings are NOT alerted on; a vitals_check task is created instead.
    """
    created: list[Alert] = []

    # Low quality: do not alert; request a re-measure via a vitals_check task.
    if reading.quality != "good":
        _create_vitals_check_task(db, reading.patient_id, reading.robot_id)
        return created

    patient = (
        db.query(Patient)
        .options(joinedload(Patient.bed))
        .filter(Patient.id == reading.patient_id)
        .first()
    )
    if not patient:
        return created

    thresholds = _get_thresholds(db, reading.patient_id)
    status = _status_for_value(reading.type, reading.value, thresholds)

    if status == "normal":
        # Close any open watch/critical alert of this type for this patient.
        open_alert = _find_open_alert(db, reading.patient_id, reading.type)
        if open_alert:
            open_alert.status = "resolved"
            db.commit()
            _broadcast_alert_resolved(open_alert)
        return created

    severity = "critical" if status == "critical" else "watch"

    label = VITAL_LABELS.get(reading.type, reading.type)
    unit = VITAL_UNITS.get(reading.type, "")
    message = f"{label} {reading.value}{unit} for {patient.name} ({patient.bed.label if patient.bed else 'no bed'}) is {status}."

    # Deduplicate: if an open alert of same patient+type exists, update severity if worse.
    open_alert = _find_open_alert(db, reading.patient_id, reading.type)
    if open_alert:
        _update_alert_severity(db, open_alert, severity)
        created.append(open_alert)
        return created

    alert = _create_alert(
        db,
        alert_type=reading.type,
        severity=severity,
        patient_id=reading.patient_id,
        robot_id=reading.robot_id,
        message=message,
        current_user_id=current_user_id,
    )
    created.append(alert)

    # Trend rule: SpO2 drops 4+ points within 10 minutes.
    if reading.type == "spo2":
        _check_spo2_trend(db, reading, created)

    return created


def _check_spo2_trend(
    db: Session, reading: VitalReading, created: list[Alert]
) -> None:
    """If SpO2 dropped 4+ points within 10 minutes, escalate to at least watch/critical."""
    window_start = reading.timestamp - timedelta(minutes=10)
    prior = (
        db.query(VitalReading)
        .filter(
            VitalReading.patient_id == reading.patient_id,
            VitalReading.type == "spo2",
            VitalReading.timestamp >= window_start,
            VitalReading.timestamp < reading.timestamp,
            VitalReading.quality == "good",
        )
        .order_by(VitalReading.timestamp.asc())
        .all()
    )
    if not prior:
        return
    # Use the earliest reading in the window as baseline.
    baseline = prior[0].value
    drop = baseline - reading.value
    if drop >= 4:
        patient = db.query(Patient).filter(Patient.id == reading.patient_id).first()
        message = (
            f"SpO\u2082 dropped {drop:.0f} points in 10 minutes "
            f"({baseline:.0f}% \u2192 {reading.value:.0f}%) for {patient.name if patient else 'patient'}."
        )
        open_alert = _find_open_alert(db, reading.patient_id, "spo2")
        severity = "critical" if reading.value < 90 else "watch"
        if open_alert:
            _update_alert_severity(db, open_alert, severity)
            # Append trend note to message
            open_alert.message = message
            db.commit()
            created.append(open_alert)
        else:
            alert = _create_alert(
                db,
                alert_type="spo2_trend",
                severity=severity,
                patient_id=reading.patient_id,
                robot_id=reading.robot_id,
                message=message,
            )
            created.append(alert)


def _create_vitals_check_task(
    db: Session, patient_id: int, robot_id: int | None
) -> None:
    """Create a vitals_check task for a low-quality reading."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    bed = patient.bed if patient else None
    task = Task(
        type="vitals_check",
        priority="medication",  # re-measure is time-sensitive
        bed_id=bed.id if bed else None,
        robot_id=None,
        status="queued",
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            manager.broadcast(
                {
                    "type": "task_created",
                    "data": {
                        "id": task.id,
                        "type": task.type,
                        "priority": task.priority,
                        "bed_id": task.bed_id,
                        "robot_id": task.robot_id,
                        "status": task.status,
                        "created_at": iso_z(task.created_at),
                    },
                }
            )
        )
    except RuntimeError:
        pass


def _broadcast_alert_resolved(alert: Alert) -> None:
    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            manager.broadcast(
                {
                    "type": "alert_resolved",
                    "data": {
                        "id": alert.id,
                        "type": alert.type,
                        "status": "resolved",
                    },
                }
            )
        )
    except RuntimeError:
        pass


# Imported here to avoid circular import at module load time.
from app.models.user import User  # noqa: E402
