"""CareBot robot simulator.

Moves the seeded robots around the ward and publishes live vitals for every
patient. Robots are cosmetic for the demo; vitals are the important signal and
are generated for all patients on every cycle.

The simulator respects the backend E-stop: while any robot is ``stopped`` it
halts movement and stops publishing vitals until a nurse/doctor resumes.

Supports scripted scenarios via --scenario:
  normal_night    Steady, mostly normal vitals
  spo2_drop       One patient's SpO2 gradually falls below 92%
  missed_medicine Same as normal_night (the backend scheduler raises the alert)
  low_battery     Robot-3 drains below 20% and returns to dock
  patient_call    A call event from Bed-01, then normal_night

Usage:
    python sim.py --scenario normal_night
"""

from __future__ import annotations

import argparse
import math
import os
import random
import time
from typing import Any

import requests


BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
SIMULATOR_EMAIL = os.environ.get("SIMULATOR_EMAIL", "nurse@carebot.in")
SIMULATOR_PASSWORD = os.environ.get("SIMULATOR_PASSWORD", "nurse123")

TOKEN: str | None = None
SESSION = requests.Session()

VITAL_TYPES = ["heart_rate", "spo2", "temperature"]

# (mean, noise std, lo, hi)
VITAL_BASELINES: dict[str, tuple[float, float, float, float]] = {
    "heart_rate": (78.0, 6.0, 55.0, 105.0),
    "spo2": (97.0, 1.5, 88.0, 100.0),
    "temperature": (36.8, 0.3, 35.5, 38.6),
}


def login_token() -> str:
    resp = SESSION.post(
        f"{BACKEND_URL}/auth/login",
        data={"username": SIMULATOR_EMAIL, "password": SIMULATOR_PASSWORD},
        timeout=5,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}


def api(method: str, path: str, **kwargs: Any) -> Any:
    """Call the backend, re-authenticating once on 401 and tolerating restarts."""
    global TOKEN
    if TOKEN is None:
        TOKEN = login_token()
    resp = SESSION.request(
        method,
        f"{BACKEND_URL}{path}",
        headers=auth_headers(),
        timeout=5,
        **kwargs,
    )
    if resp.status_code == 401:
        TOKEN = login_token()
        resp = SESSION.request(
            method,
            f"{BACKEND_URL}{path}",
            headers=auth_headers(),
            timeout=5,
            **kwargs,
        )
    resp.raise_for_status()
    return resp.json() if resp.content else None


def http_post(path: str, json: dict | None = None) -> Any:
    return api("POST", path, json=json)


def post_vital(patient_id: int, robot_id: int | None, vtype: str, value: float, quality: str = "good") -> None:
    api(
        "POST",
        "/vitals",
        json={
            "patient_id": patient_id,
            "robot_id": robot_id,
            "type": vtype,
            "value": round(value, 2),
            "quality": quality,
        },
    )


def update_robot(robot_id: int, status: str, battery: int, x: float, y: float) -> None:
    api(
        "PATCH",
        f"/robots/{robot_id}",
        json={"status": status, "battery": battery, "x": round(x, 2), "y": round(y, 2)},
    )


def move_toward(cur: float, target: float, step: float) -> float:
    if abs(cur - target) <= step:
        return target
    return cur + step if target > cur else cur - step


def fetch_beds() -> list[dict]:
    return api("GET", "/beds")


def fetch_robots() -> list[dict]:
    return api("GET", "/robots")


def _bed_assignments(robots: list[dict], beds: list[dict]) -> dict[int, list[dict]]:
    assigned: dict[int, list[dict]] = {r["id"]: [] for r in robots}
    for i, bed in enumerate(beds):
        assigned[robots[i % len(robots)]["id"]].append(bed)
    return assigned


def _initial_robot_state(robots: list[dict]) -> dict[int, dict[str, Any]]:
    return {
        r["id"]: {
            "x": 0.0,
            "y": 0.0,
            "battery": r["battery"],
            "bed_index": 0,
            "at_dock": True,
            "stopped_logged": False,
        }
        for r in robots
    }


def _publish_vitals(
    beds: list[dict],
    cycle: int,
    spo2_target: int | None = None,
    spo2_value: float = 99.0,
) -> float:
    """Publish heart rate, SpO2 and temperature for every patient on the ward."""
    drift = math.sin(cycle / 30.0) * 1.5
    type_drift = {"heart_rate": drift, "spo2": drift * 0.2, "temperature": 0.0}
    for bed in beds:
        patient = bed.get("patient")
        if not patient:
            continue
        pid = patient["id"]
        for vtype in VITAL_TYPES:
            mean, noise, lo, hi = VITAL_BASELINES[vtype]
            if spo2_target is not None and pid == spo2_target and vtype == "spo2":
                spo2_value = max(85.0, spo2_value - 0.5)
                value = spo2_value
            else:
                value = mean + type_drift[vtype] + random.gauss(0, noise)
                value = max(lo, min(hi, value))
            quality = "low" if random.random() < 0.03 else "good"
            post_vital(pid, bed.get("robot_id"), vtype, value, quality)
    return spo2_value


def _cycle_robots(
    robots_state: dict[int, dict[str, Any]],
    assignments: dict[int, list[dict]],
    drain_robot_id: int | None = None,
) -> None:
    """Advance each robot one step along its patrol route."""
    for rid, s in robots_state.items():
        assigned = assignments.get(rid, [])
        if drain_robot_id == rid:
            s["battery"] = max(0, s["battery"] - 2)

        low_battery = s["battery"] <= 20
        if low_battery or not assigned:
            target_x, target_y = 0.0, 0.0
            if s["at_dock"] and s["battery"] > 20:
                status = "idle"
            elif s["at_dock"]:
                status = "charging"
                s["battery"] = min(100, s["battery"] + 3)
            else:
                status = "busy"
                s["battery"] = max(0, s["battery"] - 1)
        else:
            bed = assigned[s["bed_index"] % len(assigned)]
            target_x, target_y = float(bed["x"]), float(bed["y"])
            status = "busy"

        step = 0.6
        s["x"] = move_toward(s["x"], target_x, step)
        s["y"] = move_toward(s["y"], target_y, step)
        s["at_dock"] = s["x"] == 0.0 and s["y"] == 0.0
        if s["at_dock"] and assigned and status == "busy":
            s["bed_index"] += 1

        try:
            update_robot(rid, status, int(s["battery"]), s["x"], s["y"])
        except Exception as exc:  # noqa: BLE001
            print(f"  robot update failed: {exc}")


def _wait_for_backend() -> bool:
    global TOKEN
    for _ in range(60):
        try:
            resp = SESSION.get(f"{BACKEND_URL}/health", timeout=3)
            if resp.status_code == 200:
                TOKEN = login_token()
                print("Simulator authenticated.")
                return True
        except Exception:  # noqa: BLE001
            pass
        print("Waiting for backend...")
        time.sleep(2)
    print("Backend not available. Exiting.")
    return False


def run(
    scenario: str,
    spo2_target: int | None = None,
    drain_robot_id: int | None = None,
) -> None:
    cycle = 0
    halted_logged = False
    resume_grace_until = 0.0
    spo2_value = 99.0
    beds = fetch_beds()
    robots = fetch_robots()

    if not robots:
        print("No robots found; is the backend seeded?")
        return

    state = _initial_robot_state(robots)
    assignments = _bed_assignments(robots, beds)
    if drain_robot_id is None and scenario == "low_battery" and len(robots) > 2:
        drain_robot_id = robots[2]["id"]

    print(
        f"Simulator: {scenario}. {len(robots)} robots, "
        f"{sum(1 for b in beds if b.get('patient'))} patients."
    )

    while True:
        cycle += 1
        try:
            # Backend E-stop is authoritative: stop everything until resumed.
            live_robots = fetch_robots()
            if any(r["status"] == "stopped" for r in live_robots):
                if not halted_logged:
                    print("E-STOP active — simulator halted. Waiting for resume...")
                halted_logged = True
                time.sleep(3)
                continue
            if halted_logged:
                print("E-stop cleared — robots idle, resuming patrol in 12s.")
                halted_logged = False
                resume_grace_until = time.monotonic() + 12

            # Refresh patient/bed membership in case data changed.
            if cycle % 10 == 1:
                beds = fetch_beds()
                assignments = _bed_assignments(robots, beds)

            if time.monotonic() < resume_grace_until:
                # Stay visibly idle right after a resume; keep vitals flowing.
                for rid, s in state.items():
                    try:
                        update_robot(rid, "idle", int(s["battery"]), s["x"], s["y"])
                    except Exception:  # noqa: BLE001
                        pass
            else:
                _cycle_robots(state, assignments, drain_robot_id)
            spo2_value = _publish_vitals(beds, cycle, spo2_target, spo2_value)
        except requests.exceptions.RequestException as exc:
            print(f"Backend unreachable ({exc}); retrying...")
            time.sleep(3)
            try:
                if TOKEN is None:
                    TOKEN = login_token()
            except Exception:  # noqa: BLE001
                pass
        except Exception as exc:  # noqa: BLE001
            print(f"Simulator cycle error: {exc}")

        time.sleep(3)


def normal_night(robots: list[dict], beds: list[dict]) -> None:  # noqa: ARG001
    run("normal_night")


def spo2_drop(robots: list[dict], beds: list[dict]) -> None:  # noqa: ARG001
    target = None
    for bed in beds:
        if bed.get("patient"):
            target = bed["patient"]["id"]
            break
    if target is None:
        print("Simulator: spo2_drop - no patients, aborting.")
        return
    print(f"Simulator: spo2_drop. Dropping SpO2 for patient {target} on Bed-01.")
    print("  Watch alert expected shortly, critical within ~1 minute.")
    run("spo2_drop", spo2_target=target)


def missed_medicine(robots: list[dict], beds: list[dict]) -> None:  # noqa: ARG001
    print("Simulator: missed_medicine. Backend scheduler creates the reminder.")
    run("missed_medicine")


def low_battery(robots: list[dict], beds: list[dict]) -> None:  # noqa: ARG001
    print("Simulator: low_battery. Robot-3 drains and returns to dock.")
    run("low_battery", drain_robot_id=robots[2]["id"] if len(robots) > 2 else None)


def patient_call(robots: list[dict], beds: list[dict]) -> None:  # noqa: ARG001
    try:
        http_post("/alerts/patient_call")
        print("  Patient call alert + auto-dispatch task created.")
    except Exception as exc:  # noqa: BLE001
        print(f"  Patient call failed: {exc}")
    run("patient_call")


SCENARIOS = {
    "normal_night": normal_night,
    "spo2_drop": spo2_drop,
    "missed_medicine": missed_medicine,
    "low_battery": low_battery,
    "patient_call": patient_call,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="CareBot robot simulator")
    parser.add_argument("--scenario", default="normal_night", help="Scenario to run")
    args = parser.parse_args()

    if args.scenario not in SCENARIOS:
        print(f"Unknown scenario '{args.scenario}'. Available: {list(SCENARIOS)}")
        return

    if not _wait_for_backend():
        return

    try:
        beds = fetch_beds()
        robots = fetch_robots()
    except Exception as exc:  # noqa: BLE001
        print(f"Could not load initial data: {exc}")
        return

    SCENARIOS[args.scenario](robots, beds)


if __name__ == "__main__":
    main()
