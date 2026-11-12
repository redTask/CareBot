"""CareBot robot simulator — Phase 2 & 3.

Registers the 3 seeded robots, moves them between bed coordinates and the
dock, and every few seconds generates realistic vitals for the patients at
each bed, POSTing them to the backend which broadcasts live over WebSocket.

Supports scripted scenarios via --scenario:
  normal_night    Steady, mostly normal vitals
  spo2_drop       One patient's SpO2 gradually falls below 92%
  missed_medicine Patient does not acknowledge a reminder
  low_battery     One robot drops below 20% and returns to dock
  patient_call    A call event from a chosen bed

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


BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

# Simulator authenticates as a nurse to access protected endpoints.
SIMULATOR_EMAIL = os.environ.get("SIMULATOR_EMAIL", "nurse@carebot.in")
SIMULATOR_PASSWORD = os.environ.get("SIMULATOR_PASSWORD", "nurse123")

TOKEN: str | None = None


def login_token() -> str:
    resp = requests.post(
        f"{BACKEND_URL}/auth/login",
        data={"username": SIMULATOR_EMAIL, "password": SIMULATOR_PASSWORD},
        timeout=5,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def auth_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}


def http_get(path: str) -> Any:
    resp = requests.get(f"{BACKEND_URL}{path}", headers=auth_headers(), timeout=5)
    resp.raise_for_status()
    return resp.json()


def http_post(path: str, json: dict | None = None) -> Any:
    resp = requests.post(
        f"{BACKEND_URL}{path}",
        headers=auth_headers(),
        json=json,
        timeout=5,
    )
    resp.raise_for_status()
    return resp.json()


def post_vital(patient_id: int, robot_id: int | None, vtype: str, value: float, quality: str = "good") -> None:
    requests.post(
        f"{BACKEND_URL}/vitals",
        headers=auth_headers(),
        json={
            "patient_id": patient_id,
            "robot_id": robot_id,
            "type": vtype,
            "value": round(value, 2),
            "quality": quality,
        },
        timeout=5,
    )


def update_robot(robot_id: int, status: str, battery: int, x: float, y: float) -> None:
    requests.patch(
        f"{BACKEND_URL}/robots/{robot_id}",
        headers=auth_headers(),
        json={"status": status, "battery": battery, "x": round(x, 2), "y": round(y, 2)},
        timeout=5,
    )


def move_toward(cur: float, target: float, step: float) -> float:
    if abs(cur - target) <= step:
        return target
    return cur + step if target > cur else cur - step


# Realistic baseline vitals per vital type (mean, noise std, lo, hi)
VITAL_BASELINES = {
    "heart_rate": (78.0, 6.0, 55.0, 105.0),
    "spo2": (97.0, 1.5, 90.0, 100.0),
    "temperature": (36.8, 0.3, 35.5, 38.5),
}

VITAL_TYPES = ["heart_rate", "spo2", "temperature"]


def normal_night(robots: list[dict], beds: list[dict]) -> None:
    """Steady night ward: mostly normal vitals, robots patrolling beds."""
    robot_beds: dict[int, list[dict]] = {r["id"]: [] for r in robots}
    for i, bed in enumerate(beds):
        robot_beds[robots[i % len(robots)]["id"]].append(bed)

    state: dict[int, dict[str, Any]] = {}
    for r in robots:
        state[r["id"]] = {
            "x": 0.0,
            "y": 0.0,
            "battery": r["battery"],
            "bed_index": 0,
            "at_dock": True,
        }

    print(f"Simulator: normal_night. {len(robots)} robots, {len(beds)} beds.")
    for r in robots:
        print(f"  {r['name']} assigned beds: {[b['label'] for b in robot_beds[r['id']]]}")

    cycle = 0
    while True:
        cycle += 1
        for r in robots:
            rid = r["id"]
            s = state[rid]
            assigned = robot_beds[rid]

            low_battery = s["battery"] <= 20
            if low_battery or not assigned:
                target_x, target_y = 0.0, 0.0  # dock
                if s["at_dock"]:
                    if s["battery"] > 20:
                        status = "idle"
                    else:
                        status = "charging"
                        s["battery"] = min(100, s["battery"] + 5)
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
            s["at_dock"] = (s["x"] == 0.0 and s["y"] == 0.0)

            update_robot(rid, status, s["battery"], s["x"], s["y"])

            if not assigned:
                continue
            bed = assigned[s["bed_index"] % len(assigned)]
            if (
                abs(s["x"] - bed["x"]) < 0.01
                and abs(s["y"] - bed["y"]) < 0.01
                and bed.get("patient_id")
            ):
                pid = bed["patient_id"]
                drift = math.sin(cycle / 30.0) * 1.5
                for vtype in VITAL_TYPES:
                    mean, noise, lo, hi = VITAL_BASELINES[vtype]
                    value = mean + drift + random.gauss(0, noise)
                    value = max(lo, min(hi, value))
                    quality = "low" if random.random() < 0.05 else "good"
                    post_vital(pid, rid, vtype, value, quality)
                s["bed_index"] += 1
                s["battery"] = max(0, s["battery"] - 1)

        time.sleep(3)


def spo2_drop(robots: list[dict], beds: list[dict]) -> None:
    """One patient's SpO2 gradually falls below 92% (watch then critical)."""
    target_patient_id = beds[0]["patient"]["id"] if beds[0].get("patient") else None
    if not target_patient_id:
        print("Simulator: spo2_drop - no patient on Bed-01, aborting.")
        return

    print(f"Simulator: spo2_drop. Dropping SpO2 for patient {target_patient_id} on Bed-01.")
    print("  Watch alert expected within ~9s, critical within ~15s of start.")

    # Run normal background vitals for all patients, but force SpO2 decline for target.
    robot_beds: dict[int, list[dict]] = {r["id"]: [] for r in robots}
    for i, bed in enumerate(beds):
        robot_beds[robots[i % len(robots)]["id"]].append(bed)

    state: dict[int, dict[str, Any]] = {}
    for r in robots:
        state[r["id"]] = {
            "x": 0.0, "y": 0.0, "battery": r["battery"],
            "bed_index": 0, "at_dock": True,
        }

    spo2_value = 99.0  # start high
    cycle = 0
    while True:
        cycle += 1
        for r in robots:
            rid = r["id"]
            s = state[rid]
            assigned = robot_beds[rid]

            low_battery = s["battery"] <= 20
            if low_battery or not assigned:
                target_x, target_y = 0.0, 0.0
                if s["at_dock"]:
                    if s["battery"] > 20:
                        status = "idle"
                    else:
                        status = "charging"
                        s["battery"] = min(100, s["battery"] + 5)
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
            s["at_dock"] = (s["x"] == 0.0 and s["y"] == 0.0)

            update_robot(rid, status, s["battery"], s["x"], s["y"])

            if not assigned:
                continue
            bed = assigned[s["bed_index"] % len(assigned)]
            if abs(s["x"] - bed["x"]) < 0.01 and abs(s["y"] - bed["y"]) < 0.01 and bed.get("patient_id"):
                pid = bed["patient_id"]
                for vtype in VITAL_TYPES:
                    mean, noise, lo, hi = VITAL_BASELINES[vtype]
                    if pid == target_patient_id and vtype == "spo2":
                        # Gradual SpO2 decline: drop ~0.5 per cycle (every 3s)
                        spo2_value = max(85.0, spo2_value - 0.5)
                        value = spo2_value
                    else:
                        value = mean + random.gauss(0, noise)
                        value = max(lo, min(hi, value))
                    quality = "low" if random.random() < 0.05 else "good"
                    post_vital(pid, rid, vtype, value, quality)
                s["bed_index"] += 1
                s["battery"] = max(0, s["battery"] - 1)

        time.sleep(3)


def missed_medicine(robots: list[dict], beds: list[dict]) -> None:
    """Scenario: medication reminder is created but not acknowledged -> alert."""
    print("Simulator: missed_medicine.")
    print("  Wait ~2 minutes for the scheduled medication reminder.")
    print("  If not acknowledged, a missed-medicine alert is created.")
    # Just run normal_night behavior; the medication scheduler on the backend
    # creates the event and the missed alert if not acknowledged.
    normal_night(robots, beds)


def low_battery(robots: list[dict], beds: list[dict]) -> None:
    """One robot drops below 20% and returns to dock."""
    print("Simulator: low_battery. Robot-3 will drain to <20% and return to dock.")
    robot_beds: dict[int, list[dict]] = {r["id"]: [] for r in robots}
    for i, bed in enumerate(beds):
        robot_beds[robots[i % len(robots)]["id"]].append(bed)

    state: dict[int, dict[str, Any]] = {}
    for r in robots:
        state[r["id"]] = {
            "x": 0.0, "y": 0.0, "battery": r["battery"],
            "bed_index": 0, "at_dock": True,
        }

    # Force Robot-3 to drain fast
    drain_robot_id = robots[2]["id"] if len(robots) > 2 else robots[0]["id"]

    cycle = 0
    while True:
        cycle += 1
        for r in robots:
            rid = r["id"]
            s = state[rid]
            assigned = robot_beds[rid]

            # Force drain on the designated robot
            if rid == drain_robot_id:
                s["battery"] = max(0, s["battery"] - 2)

            low_battery = s["battery"] <= 20
            if low_battery or not assigned:
                target_x, target_y = 0.0, 0.0
                if s["at_dock"]:
                    if s["battery"] > 20:
                        status = "idle"
                    else:
                        status = "charging"
                        s["battery"] = min(100, s["battery"] + 5)
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
            s["at_dock"] = (s["x"] == 0.0 and s["y"] == 0.0)

            update_robot(rid, status, s["battery"], s["x"], s["y"])

            if not assigned:
                continue
            bed = assigned[s["bed_index"] % len(assigned)]
            if abs(s["x"] - bed["x"]) < 0.01 and abs(s["y"] - bed["y"]) < 0.01 and bed.get("patient_id"):
                pid = bed["patient_id"]
                for vtype in VITAL_TYPES:
                    mean, noise, lo, hi = VITAL_BASELINES[vtype]
                    value = mean + random.gauss(0, noise)
                    value = max(lo, min(hi, value))
                    post_vital(pid, rid, vtype, value, "good")
                s["bed_index"] += 1
                s["battery"] = max(0, s["battery"] - 1)

        time.sleep(3)


def patient_call(robots: list[dict], beds: list[dict]) -> None:
    """Trigger a patient call from a chosen bed via the backend API."""
    target_bed = beds[0]  # Bed-01
    pid = target_bed["patient"]["id"] if target_bed.get("patient") else None
    if not pid:
        print("Simulator: patient_call - no patient on Bed-01, aborting.")
        return

    print(f"Simulator: patient_call from {target_bed['label']} (patient {pid}).")
    try:
        http_post("/alerts/patient_call")
        print("  Patient call alert + auto-dispatch task created.")
    except Exception as exc:  # noqa: BLE001
        print(f"  Patient call failed: {exc}")

    # Then run normal_night in background
    normal_night(robots, beds)


SCENARIOS = {
    "normal_night": normal_night,
    "spo2_drop": spo2_drop,
    "missed_medicine": missed_medicine,
    "low_battery": low_battery,
    "patient_call": patient_call,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="CareBot robot simulator")
    parser.add_argument(
        "--scenario",
        default="normal_night",
        help="Scenario to run",
    )
    args = parser.parse_args()

    if args.scenario not in SCENARIOS:
        print(f"Unknown scenario '{args.scenario}'. Available: {list(SCENARIOS)}")
        return

    # Wait for backend to be ready, then authenticate
    global TOKEN
    for _ in range(30):
        try:
            http_get("/health")
            TOKEN = login_token()
            print("Simulator authenticated.")
            break
        except Exception:
            print("Waiting for backend...")
            time.sleep(2)
    else:
        print("Backend not available. Exiting.")
        return

    beds = http_get("/beds")
    robots = http_get("/robots")
    for bed in beds:
        bed["patient_id"] = bed["patient"]["id"] if bed.get("patient") else None

    print(f"Simulator connected to {BACKEND_URL}")
    SCENARIOS[args.scenario](robots, beds)


if __name__ == "__main__":
    main()
