"""Pytest configuration — in-memory SQLite test database."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import SessionLocal, engine  # noqa: F401
from app.models.alert import Alert
from app.models.bed import Bed
from app.models.care_plan import CarePlan
from app.models.escalation_policy import EscalationPolicy
from app.models.medication import Medication
from app.models.medication_event import MedicationEvent
from app.models.patient import Patient
from app.models.robot import Robot
from app.models.task import Task
from app.models.user import User
from app.models.vital_reading import VitalReading
from app.models.ward import Ward
from app.core.security import get_password_hash


@pytest.fixture
def db_session():
    """Create an in-memory SQLite database for each test."""
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(test_engine)
    TestSessionLocal = sessionmaker(bind=test_engine)
    db = TestSessionLocal()
    yield db
    db.close()


@pytest.fixture
def seed_data(db_session):
    """Seed a minimal ward with 1 patient, 1 bed, 2 robots, users for each role."""
    # Users
    nurse = User(name="Nurse", email="nurse@test.in", password_hash=get_password_hash("pw"), role="nurse")
    doctor = User(name="Doctor", email="doctor@test.in", password_hash=get_password_hash("pw"), role="doctor")
    admin = User(name="Admin", email="admin@test.in", password_hash=get_password_hash("pw"), role="admin")
    db_session.add_all([nurse, doctor, admin])
    db_session.flush()

    # Ward + bed
    ward = Ward(name="Test Ward")
    db_session.add(ward)
    db_session.flush()
    bed = Bed(ward_id=ward.id, label="Bed-01", x=0.0, y=0.0)
    db_session.add(bed)
    db_session.flush()

    # Patient
    patient = Patient(name="Test Patient", age=60, sex="M", bed_id=bed.id, conditions="None")
    db_session.add(patient)
    db_session.flush()

    # Care plan with default thresholds
    cp = CarePlan(
        patient_id=patient.id,
        notes="",
        thresholds={
            "heart_rate": {"min": 50, "max": 120, "critical_min": 40, "critical_max": 140},
            "spo2": {"min": 92, "max": 100, "critical_min": 90, "critical_max": 100},
            "temperature": {"min": 36.0, "max": 38.0, "critical_min": 35.0, "critical_max": 39.0},
        },
    )
    db_session.add(cp)

    # Robots
    r1 = Robot(name="R1", status="idle", battery=100, x=0.0, y=0.0)
    r2 = Robot(name="R2", status="idle", battery=95, x=10.0, y=10.0)
    r3 = Robot(name="R3", status="idle", battery=10, x=1.0, y=1.0)  # low battery
    db_session.add_all([r1, r2, r3])
    db_session.flush()

    # Escalation policy: 30s -> nurse, 60s -> doctor
    policy = EscalationPolicy(
        ward_id=ward.id,
        steps=[
            {"after_seconds": 30, "notify_role": "nurse"},
            {"after_seconds": 60, "notify_role": "doctor"},
        ],
    )
    db_session.add(policy)
    db_session.commit()

    return {
        "nurse": nurse,
        "doctor": doctor,
        "admin": admin,
        "ward": ward,
        "bed": bed,
        "patient": patient,
        "robots": [r1, r2, r3],
    }
