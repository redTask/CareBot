"""Seed synthetic demo data (ward, beds, patients, robots, users, escalation policy,
care plans, medications)."""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.alert import Alert
from app.models.audit_log import AuditLog
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


def seed() -> None:
    db = SessionLocal()
    try:
        if db.query(User).first():
            print("Seed data already present. Skipping.")
            return

        # Users (one per role)
        users = [
            User(
                name="Nurse User",
                email="nurse@carebot.in",
                password_hash=get_password_hash("nurse123"),
                role="nurse",
            ),
            User(
                name="Doctor User",
                email="doctor@carebot.in",
                password_hash=get_password_hash("doctor123"),
                role="doctor",
            ),
            User(
                name="Admin User",
                email="admin@carebot.in",
                password_hash=get_password_hash("admin123"),
                role="admin",
            ),
        ]
        db.add_all(users)
        db.flush()

        # Ward
        ward = Ward(name="General Ward")
        db.add(ward)
        db.flush()

        # 10 beds in a 2x5 grid
        beds = []
        for i in range(10):
            row = i // 5
            col = i % 5
            beds.append(
                Bed(ward_id=ward.id, label=f"Bed-{i + 1:02d}", x=col * 4.0, y=row * 4.0)
            )
        db.add_all(beds)
        db.flush()

        # 10 synthetic patients
        patients = [
            Patient(name="Ramesh Kumar", age=68, sex="M", bed_id=beds[0].id, conditions="Hypertension, Diabetes"),
            Patient(name="Sita Nair", age=54, sex="F", bed_id=beds[1].id, conditions="Asthma"),
            Patient(name="Arun Singh", age=72, sex="M", bed_id=beds[2].id, conditions="Heart disease"),
            Patient(name="Lakshmi Devi", age=45, sex="F", bed_id=beds[3].id, conditions=""),
            Patient(name="Mohammed Ali", age=80, sex="M", bed_id=beds[4].id, conditions="COPD"),
            Patient(name="Priya Menon", age=39, sex="F", bed_id=beds[5].id, conditions="Thyroid"),
            Patient(name="Rajesh Reddy", age=61, sex="M", bed_id=beds[6].id, conditions="Hypertension"),
            Patient(name="Anita Das", age=50, sex="F", bed_id=beds[7].id, conditions="Diabetes"),
            Patient(name="Suresh Babu", age=66, sex="M", bed_id=beds[8].id, conditions=""),
            Patient(name="Kavitha R", age=41, sex="F", bed_id=beds[9].id, conditions="Migraine"),
        ]
        db.add_all(patients)
        db.flush()

        # 3 robots at the dock
        robots = [
            Robot(name="Robot-1", status="idle", battery=100, x=0.0, y=0.0),
            Robot(name="Robot-2", status="idle", battery=95, x=0.0, y=0.0),
            Robot(name="Robot-3", status="idle", battery=88, x=0.0, y=0.0),
        ]
        db.add_all(robots)
        db.flush()

        # Default escalation policy: 30s -> nurse, 60s -> doctor
        policy = EscalationPolicy(
            ward_id=ward.id,
            steps=[
                {"after_seconds": 30, "notify_role": "nurse"},
                {"after_seconds": 60, "notify_role": "doctor"},
            ],
        )
        db.add(policy)
        db.flush()

        # Care plans with default thresholds for all patients
        default_thresholds = {
            "heart_rate": {"min": 50, "max": 120, "critical_min": 40, "critical_max": 140},
            "spo2": {"min": 92, "max": 100, "critical_min": 90, "critical_max": 100},
            "temperature": {"min": 36.0, "max": 38.0, "critical_min": 35.0, "critical_max": 39.0},
        }
        for patient in patients:
            cp = CarePlan(
                patient_id=patient.id,
                notes="Routine care plan.",
                thresholds=default_thresholds,
            )
            db.add(cp)

        # Medications: one scheduled in ~2 minutes so the demo can trigger it.
        now = datetime.now(timezone.utc)
        soon = (now + timedelta(minutes=2)).time().replace(second=0, microsecond=0)
        med = Medication(
            patient_id=patients[0].id,  # Ramesh Kumar
            drug="Paracetamol",
            dose="500mg",
            schedule_times=[soon.isoformat()],
        )
        db.add(med)
        db.flush()

        db.commit()
        print(
            "Seed complete: 3 users, 1 ward, 10 beds, 10 patients, 3 robots, "
            "1 escalation policy, 10 care plans, 1 medication."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
