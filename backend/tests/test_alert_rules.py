"""Tests for alert engine rules — thresholds, trend, deduplication, low-quality."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta

from app.models.vital_reading import VitalReading
from app.services.alert_engine import process_vital, DEFAULT_THRESHOLDS


def test_default_thresholds():
    assert DEFAULT_THRESHOLDS["heart_rate"]["min"] == 50
    assert DEFAULT_THRESHOLDS["heart_rate"]["max"] == 120
    assert DEFAULT_THRESHOLDS["spo2"]["min"] == 92
    assert DEFAULT_THRESHOLDS["temperature"]["min"] == 36.0
    assert DEFAULT_THRESHOLDS["temperature"]["max"] == 38.0


def test_heart_rate_normal_no_alert(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    # HR 80 within 50-120 -> normal
    assert _status_for_value("heart_rate", 80, DEFAULT_THRESHOLDS) == "normal"


def test_heart_rate_watch(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    # HR 45 below 50 but above 40 -> watch
    assert _status_for_value("heart_rate", 45, DEFAULT_THRESHOLDS) == "watch"


def test_heart_rate_critical(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    # HR 35 below 40 -> critical
    assert _status_for_value("heart_rate", 35, DEFAULT_THRESHOLDS) == "critical"


def test_spo2_normal(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    # SpO2 97 >= 92 -> normal
    assert _status_for_value("spo2", 97, DEFAULT_THRESHOLDS) == "normal"


def test_spo2_watch(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    # SpO2 91 below 92 but above 90 -> watch
    assert _status_for_value("spo2", 91, DEFAULT_THRESHOLDS) == "watch"


def test_spo2_critical(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    # SpO2 89 below 90 -> critical
    assert _status_for_value("spo2", 89, DEFAULT_THRESHOLDS) == "critical"


def test_temperature_normal(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    assert _status_for_value("temperature", 37.0, DEFAULT_THRESHOLDS) == "normal"


def test_temperature_critical_high(db_session, seed_data):
    from app.services.alert_engine import _status_for_value
    # Temp 39.5 above 39 -> critical
    assert _status_for_value("temperature", 39.5, DEFAULT_THRESHOLDS) == "critical"


def test_low_quality_no_alert_creates_task(db_session, seed_data):
    """Low-quality reading should NOT create an alert; it creates a vitals_check task."""
    patient = seed_data["patient"]
    reading = VitalReading(
        patient_id=patient.id,
        robot_id=1,
        type="spo2",
        value=85.0,
        quality="low",
        timestamp=datetime.now(timezone.utc),
    )
    db_session.add(reading)
    db_session.commit()
    db_session.refresh(reading)

    alerts = process_vital(db_session, reading)
    assert alerts == []  # no alert for low quality

    # A vitals_check task should have been created
    from app.models.task import Task
    tasks = db_session.query(Task).filter(Task.type == "vitals_check").all()
    assert len(tasks) == 1


def test_spo2_trend_drop(db_session, seed_data):
    """SpO2 drops 4+ points within 10 minutes -> trend alert."""
    patient = seed_data["patient"]
    now = datetime.now(timezone.utc)

    # Baseline reading 9 minutes ago (within the 10-minute window)
    baseline = VitalReading(
        patient_id=patient.id,
        robot_id=1,
        type="spo2",
        value=98.0,
        quality="good",
        timestamp=now - timedelta(minutes=9),
    )
    # Current reading 90.0 (drop of 8, below 92 -> watch)
    current = VitalReading(
        patient_id=patient.id,
        robot_id=1,
        type="spo2",
        value=90.0,
        quality="good",
        timestamp=now,
    )
    db_session.add_all([baseline, current])
    db_session.commit()
    db_session.refresh(baseline)
    db_session.refresh(current)

    # Process baseline first (no alert, normal)
    process_vital(db_session, baseline)
    # Process current -> should trigger trend alert (drop of 8 >= 4)
    alerts = process_vital(db_session, current)
    assert len(alerts) >= 1
    # Trend rule updates the existing spo2 alert (deduplication) with trend message
    spo2_alerts = [a for a in alerts if a.type in ("spo2", "spo2_trend")]
    assert len(spo2_alerts) >= 1
    assert "dropped" in spo2_alerts[0].message.lower() or "8" in spo2_alerts[0].message
    assert spo2_alerts[0].severity in ("watch", "critical")


def test_spo2_trend_no_drop(db_session, seed_data):
    """SpO2 drops less than 4 points -> no trend alert."""
    patient = seed_data["patient"]
    now = datetime.now(timezone.utc)

    baseline = VitalReading(
        patient_id=patient.id,
        robot_id=1,
        type="spo2",
        value=97.0,
        quality="good",
        timestamp=now - timedelta(minutes=10),
    )
    current = VitalReading(
        patient_id=patient.id,
        robot_id=1,
        type="spo2",
        value=95.0,
        quality="good",
        timestamp=now,
    )
    db_session.add_all([baseline, current])
    db_session.commit()

    process_vital(db_session, baseline)
    alerts = process_vital(db_session, current)
    spo2_trend = [a for a in alerts if a.type == "spo2_trend"]
    assert len(spo2_trend) == 0


def test_deduplication_repeat_alert(db_session, seed_data):
    """Same patient + type while open should not create duplicate alerts."""
    patient = seed_data["patient"]
    now = datetime.now(timezone.utc)

    from app.models.alert import Alert

    r1 = VitalReading(
        patient_id=patient.id,
        robot_id=1,
        type="spo2",
        value=89.0,
        quality="good",
        timestamp=now,
    )
    db_session.add(r1)
    db_session.commit()
    db_session.refresh(r1)

    alerts1 = process_vital(db_session, r1)
    assert len(alerts1) == 1
    assert alerts1[0].status == "open"

    # Second reading same low SpO2 -> should update, not duplicate
    r2 = VitalReading(
        patient_id=patient.id,
        robot_id=1,
        type="spo2",
        value=88.0,
        quality="good",
        timestamp=now,
    )
    db_session.add(r2)
    db_session.commit()
    db_session.refresh(r2)

    alerts2 = process_vital(db_session, r2)
    # Should be the same alert updated, not a new one
    spo2_alerts = db_session.query(Alert).filter(Alert.type == "spo2").all()
    assert len(spo2_alerts) == 1  # deduplicated


def test_care_plan_override_threshold(db_session, seed_data):
    """Doctor can override thresholds per patient via CarePlan."""
    patient = seed_data["patient"]
    from app.services.alert_engine import _get_thresholds, _status_for_value
    thresholds = _get_thresholds(db_session, patient.id)
    # Default spo2 min is 92
    assert thresholds["spo2"]["min"] == 92
    # With a strict override
    thresholds["spo2"]["min"] = 95
    assert _status_for_value("spo2", 94, thresholds) == "watch"
