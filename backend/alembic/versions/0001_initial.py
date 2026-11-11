"""initial

Revision ID: 0001_initial
Revises:
Create Date: 2026-11-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    op.create_table(
        "wards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_wards_id"), "wards", ["id"], unique=False)

    op.create_table(
        "beds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("label", sa.String(length=20), nullable=False),
        sa.Column("x", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("y", sa.Float(), nullable=False, server_default="0.0"),
        sa.ForeignKeyConstraint(["ward_id"], ["wards.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_beds_id"), "beds", ["id"], unique=False)

    op.create_table(
        "patients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("sex", sa.String(length=10), nullable=False),
        sa.Column("bed_id", sa.Integer(), nullable=True),
        sa.Column("conditions", sa.String(length=255), nullable=False, server_default=""),
        sa.ForeignKeyConstraint(["bed_id"], ["beds.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_patients_id"), "patients", ["id"], unique=False)

    op.create_table(
        "care_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("notes", sa.String(), nullable=False, server_default=""),
        sa.Column("thresholds", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("patient_id"),
    )
    op.create_index(op.f("ix_care_plans_id"), "care_plans", ["id"], unique=False)

    op.create_table(
        "medications",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("drug", sa.String(length=100), nullable=False),
        sa.Column("dose", sa.String(length=100), nullable=False),
        sa.Column("schedule_times", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medications_id"), "medications", ["id"], unique=False)

    op.create_table(
        "robots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="idle"),
        sa.Column("battery", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("x", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("y", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("current_task_id", sa.Integer(), nullable=True),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_robots_id"), "robots", ["id"], unique=False)

    op.create_table(
        "medication_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("medication_id", sa.Integer(), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["medication_id"], ["medications.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medication_events_id"), "medication_events", ["id"], unique=False)

    op.create_table(
        "vital_readings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("robot_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("quality", sa.String(length=20), nullable=False, server_default="good"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ),
        sa.ForeignKeyConstraint(["robot_id"], ["robots.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_vital_readings_id"), "vital_readings", ["id"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=30), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("bed_id", sa.Integer(), nullable=True),
        sa.Column("robot_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="queued"),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["bed_id"], ["beds.id"], ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ),
        sa.ForeignKeyConstraint(["robot_id"], ["robots.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_tasks_id"), "tasks", ["id"], unique=False)

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=True),
        sa.Column("robot_id", sa.Integer(), nullable=True),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("acknowledged_by", sa.Integer(), nullable=True),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("escalation_level", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"], ),
        sa.ForeignKeyConstraint(["robot_id"], ["robots.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alerts_id"), "alerts", ["id"], unique=False)

    op.create_table(
        "escalation_policies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ward_id", sa.Integer(), nullable=False),
        sa.Column("steps", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.ForeignKeyConstraint(["ward_id"], ["wards.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_escalation_policies_id"), "escalation_policies", ["id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity", sa.String(length=100), nullable=False),
        sa.Column("details", postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_audit_logs_id"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index(op.f("ix_escalation_policies_id"), table_name="escalation_policies")
    op.drop_table("escalation_policies")
    op.drop_index(op.f("ix_alerts_id"), table_name="alerts")
    op.drop_table("alerts")
    op.drop_index(op.f("ix_tasks_id"), table_name="tasks")
    op.drop_table("tasks")
    op.drop_index(op.f("ix_vital_readings_id"), table_name="vital_readings")
    op.drop_table("vital_readings")
    op.drop_index(op.f("ix_medication_events_id"), table_name="medication_events")
    op.drop_table("medication_events")
    op.drop_index(op.f("ix_robots_id"), table_name="robots")
    op.drop_table("robots")
    op.drop_index(op.f("ix_medications_id"), table_name="medications")
    op.drop_table("medications")
    op.drop_index(op.f("ix_care_plans_id"), table_name="care_plans")
    op.drop_table("care_plans")
    op.drop_index(op.f("ix_patients_id"), table_name="patients")
    op.drop_table("patients")
    op.drop_index(op.f("ix_beds_id"), table_name="beds")
    op.drop_table("beds")
    op.drop_index(op.f("ix_wards_id"), table_name="wards")
    op.drop_table("wards")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
