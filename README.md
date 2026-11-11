# CareBot Platform

Web app for nurses and doctors to monitor patients and command patient-care robots in a hospital ward. Hackathon project for the Government of Kerala &mdash; problem statement "Developing a system for Patient Care in the Health Sector".

> **Research prototype &mdash; not a medical device.** Synthetic patient data only.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS, Recharts, Zustand
- Backend: Python FastAPI, SQLAlchemy, Alembic, Pydantic
- Database: PostgreSQL (plain, no TimescaleDB)
- Realtime: native WebSocket (FastAPI to browser)
- Background jobs: Redis + asyncio worker (alert escalation timers, medication scheduler)
- Auth: JWT access tokens, bcrypt, role-based access control
- Robot simulator: standalone Python (HTTP + WebSocket, no MQTT)
- Tests: pytest (backend), Vitest (frontend)
- i18n: English / Malayalam toggle

## Directory layout

```
backend/        app/api, app/models, app/services, app/ws, alembic, tests
frontend/       src/pages, src/components, src/store, src/lib, src/test
simulator/      sim.py, scenarios.py
docs/           BUILD_BRIEF.md
docker-compose.yml
README.md
.env.example
```

## Setup

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
   Adjust values if needed. `SECRET_KEY` must be changed for production. No secrets are committed.

2. Start everything with Docker Compose:
   ```bash
   docker compose up --build
   ```

3. Open the frontend at <http://localhost:5173>.

4. Backend API docs (OpenAPI): <http://localhost:8000/docs>

## Demo accounts (seeded)

| Role | Email | Password | Can access |
|------|-------|----------|------------|
| Nurse | nurse@carebot.in | nurse123 | Dashboard, alerts, tasks, patient detail, E-stop |
| Doctor | doctor@carebot.in | doctor123 | All nurse features + care plan edits, thresholds |
| Admin | admin@carebot.in | admin123 | All features + audit log view |

## Verification &mdash; Phase 1 (Foundation)

```bash
# 1. Start the stack
docker compose up --build

# 2. Backend health
curl http://localhost:8000/health

# 3. Log in as each role
curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=nurse@carebot.in' -d 'password=nurse123'
curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=doctor@carebot.in' -d 'password=doctor123'
curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=admin@carebot.in' -d 'password=admin123'

# 4. Role-based access: admin-only route (expect 200 for admin, 403 for nurse)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=admin@carebot.in' -d 'password=admin123' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
NURSE_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=nurse@carebot.in' -d 'password=nurse123' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8000/users   # 200
curl -s -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer $NURSE_TOKEN" http://localhost:8000/users   # 403
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/users                                          # 401

# 5. Open http://localhost:5173, log in as each role, confirm wrong roles
#    are blocked from restricted routes.
```

## Verification &mdash; Phase 2 (Live Dashboard + Simulator)

```bash
# 1. Ensure stack is running (all 5 services Up)
docker compose ps

# 2. Backend + login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=nurse@carebot.in' -d 'password=nurse123' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 3. Live data from simulator
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/beds \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Beds with live vitals: {sum(1 for b in d if b.get(\"latest_vital\"))}/10')"
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/robots \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Robots reporting: {len(d)}')"

# 4. Frontend
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/   # 200

# Open http://localhost:5173, log in, observe live floor plan with moving robots
# and updating vitals on all 10 beds.
```

## Verification &mdash; Phase 3 (Alerts, Escalation, Tasks, E-stop, Medication, Patient Call, Audit)

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=nurse@carebot.in' -d 'password=nurse123' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 1. Create a critical alert via vitals (SpO2 = 88%)
curl -s -X POST http://localhost:8000/vitals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patient_id":1,"robot_id":1,"type":"spo2","value":88.0,"quality":"good"}'

# 2. Check alert created (critical severity)
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/alerts \
  | python3 -c "import sys,json; [print(a['severity'], a['type'], a['message'][:60]) for a in json.load(sys.stdin) if a['status']=='open']"

# 3. Acknowledge alert (stops escalation)
ALERT_ID=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/alerts \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
curl -s -X POST http://localhost:8000/alerts/$ALERT_ID/acknowledge \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'

# 4. Dispatch a robot to the bed
curl -s -X POST http://localhost:8000/tasks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"visit_bed","priority":"emergency","bed_id":1}'

# 5. E-stop (all robots halt)
curl -s -X POST http://localhost:8000/alerts/estop \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/robots \
  | python3 -c "import sys,json; [print(r['name'], r['status']) for r in json.load(sys.stdin)]"

# 6. Resume (nurse/doctor only)
curl -s -X POST http://localhost:8000/alerts/resume \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'

# 7. Audit log (admin only)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d 'username=admin@carebot.in' -d 'password=admin123' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:8000/audit
```

## Verification &mdash; Phase 4 (Polish, i18n, Accessibility, Tests)

```bash
# 1. Frontend loads
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/   # 200

# 2. Open http://localhost:5173
#    - Click language toggle (English / Malayalam) in header
#    - E-stop button visible in header on every screen
#    - Offline banner appears when WebSocket drops
#    - Research prototype disclaimer in header and footer
#    - Large touch targets, keyboard navigation, visible focus states

# 3. Backend tests (pytest)
cd backend && python3 -m pytest tests/ -v   # 26 tests pass

# 4. Frontend tests (Vitest)
cd ../frontend && npx vitest run   # 15 tests pass
```

## Simulator Scenarios

The simulator runs `normal_night` by default. To run a different scenario, change the `command` in `docker-compose.yml` under the `simulator` service, or run directly:

```bash
# Available scenarios:
#   normal_night    Steady, mostly normal vitals (default)
#   spo2_drop       One patient's SpO2 gradually falls below 92%
#   missed_medicine Medication reminder is not acknowledged -> alert
#   low_battery     One robot drops below 20% and returns to dock
#   patient_call    Patient call from Bed-01 -> high-priority alert + dispatch

# Example: run spo2_drop scenario
docker compose up -d --build simulator   # after editing docker-compose.yml simulator command
```

## Demo Script (Section 8 of Build Brief)

**Simulated night ward:**

1. Run `spo2_drop` scenario. A patient's SpO2 falls &mdash; a watch alert appears, then turns critical.
2. Do not acknowledge &mdash; alert escalates after the configured delay (30s demo).
3. Acknowledge the alert &mdash; escalation stops.
4. Dispatch a robot to the bed &mdash; watch the task complete.
5. Press E-stop &mdash; all robots halt from any page.
6. Resume &mdash; nurse/doctor confirms, robots return to idle.
7. Open patient page &mdash; view trend chart and audit trail.

## Tests

- **Backend**: `cd backend && python3 -m pytest tests/ -v` (26 tests: alert rules, escalation timing, task assignment)
- **Frontend**: `cd frontend && npx vitest run` (15 tests: BedCard status/keyboard nav, EStopButton i18n)

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg2://carebot:carebot@localhost:5432/carebot` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT signing key (change in production) | `dev-secret-change-me-in-production` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiry | `10080` (7 days) |
| `ESCALATION_DEMO_SECONDS` | Escalation demo delay | `30` |

No secrets are committed to the repository. Use `.env.example` as a template.

## Phases

- Phase 1: Foundation &mdash; scaffold, Docker Compose, models/migrations, seed, JWT login with roles.
- Phase 2: Live dashboard, WebSocket, vitals ingestion, simulator movement, patient detail charts.
- Phase 3: Alerts, escalation, tasks, medication reminders, patient call, E-stop/resume, audit log.
- Phase 4: Polish &mdash; Malayalam toggle, offline banner, responsive/accessible UI, empty/error states, tests, README.

## Future work (out of scope for MVP)

Voice commands, video calls and teleoperation, MQTT, TimescaleDB, Keycloak, Kubernetes, fall detection from camera, reports and exports, family portal, real robot integration, hospital-system and ABDM integration.

## License

Research prototype &mdash; not a medical device.
