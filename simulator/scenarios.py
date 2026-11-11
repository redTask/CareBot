"""Scripted scenarios.

Phase 2 implements ``normal_night``. The remaining scenarios are stubs to be
wired up in Phase 3 (alerts, escalation, E-stop).
"""

from typing import Callable

SCENARIOS = ["normal_night", "spo2_drop", "missed_medicine", "low_battery", "patient_call"]

ScenarioFn = Callable[..., None]

__all__ = ["SCENARIOS", "ScenarioFn"]
