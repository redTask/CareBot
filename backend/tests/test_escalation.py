"""Tests for escalation timing — unacknowledged alert advances levels."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from app.models.alert import Alert
from app.services.escalation_worker import _escalate_due_alerts


def test_escalation_advances_level(db_session, seed_data):
    """An open unacknowledged alert past its delay advances to next level."""
    patient = seed_data["patient"]
    # Create an alert created 40 seconds ago (past the 30s nurse step)
    created = datetime.now(timezone.utc) - timedelta(seconds=40)
    alert = Alert(
        type="spo2",
        severity="watch",
        patient_id=patient.id,
        robot_id=None,
        message="Test alert",
        status="open",
        escalation_level=0,
        created_at=created,
    )
    db_session.add(alert)
    db_session.commit()

    asyncio.run(_escalate_due_alerts(db_session))
    db_session.refresh(alert)
    assert alert.escalation_level == 1  # advanced to doctor step


def test_escalation_stops_at_last_level(db_session, seed_data):
    """Alert at last escalation level does not advance further."""
    patient = seed_data["patient"]
    created = datetime.now(timezone.utc) - timedelta(seconds=200)
    alert = Alert(
        type="spo2",
        severity="critical",
        patient_id=patient.id,
        robot_id=None,
        message="Test",
        status="open",
        escalation_level=2,  # past both steps (nurse + doctor)
        created_at=created,
    )
    db_session.add(alert)
    db_session.commit()

    asyncio.run(_escalate_due_alerts(db_session))
    db_session.refresh(alert)
    assert alert.escalation_level == 2  # stays at max


def test_escalation_not_before_delay(db_session, seed_data):
    """Alert not yet past delay does not escalate."""
    patient = seed_data["patient"]
    created = datetime.now(timezone.utc) - timedelta(seconds=10)  # only 10s old
    alert = Alert(
        type="spo2",
        severity="watch",
        patient_id=patient.id,
        robot_id=None,
        message="Test",
        status="open",
        escalation_level=0,
        created_at=created,
    )
    db_session.add(alert)
    db_session.commit()

    asyncio.run(_escalate_due_alerts(db_session))
    db_session.refresh(alert)
    assert alert.escalation_level == 0  # not yet due


def test_acknowledged_alert_not_escalated(db_session, seed_data):
    """Acknowledged alerts are skipped by the escalation worker."""
    patient = seed_data["patient"]
    created = datetime.now(timezone.utc) - timedelta(seconds=40)
    alert = Alert(
        type="spo2",
        severity="watch",
        patient_id=patient.id,
        robot_id=None,
        message="Test",
        status="acknowledged",
        escalation_level=0,
        acknowledged_at=datetime.now(timezone.utc),
        created_at=created,
    )
    db_session.add(alert)
    db_session.commit()

    asyncio.run(_escalate_due_alerts(db_session))
    db_session.refresh(alert)
    assert alert.escalation_level == 0  # acknowledged, not escalated


def test_resolved_alert_not_escalated(db_session, seed_data):
    """Resolved alerts are skipped by the escalation worker."""
    patient = seed_data["patient"]
    created = datetime.now(timezone.utc) - timedelta(seconds=40)
    alert = Alert(
        type="spo2",
        severity="watch",
        patient_id=patient.id,
        robot_id=None,
        message="Test",
        status="resolved",
        escalation_level=0,
        created_at=created,
    )
    db_session.add(alert)
    db_session.commit()

    asyncio.run(_escalate_due_alerts(db_session))
    db_session.refresh(alert)
    assert alert.escalation_level == 0  # resolved, not escalated
