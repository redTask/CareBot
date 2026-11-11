from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, users, beds, robots, vitals, patients
from app.api import alerts, tasks, audit, care_plans, medication_events
from app.core.config import settings
from app.ws.manager import manager
from app.services.escalation_worker import run_escalation_worker
from app.services.medication_scheduler import run_medication_scheduler

# Import all models so SQLAlchemy registers every table before first query.
import app.models  # noqa: F401
import app.models.alert  # noqa: F401
import app.models.audit_log  # noqa: F401
import app.models.bed  # noqa: F401
import app.models.care_plan  # noqa: F401
import app.models.escalation_policy  # noqa: F401
import app.models.medication  # noqa: F401
import app.models.medication_event  # noqa: F401
import app.models.patient  # noqa: F401
import app.models.robot  # noqa: F401
import app.models.task  # noqa: F401
import app.models.user  # noqa: F401
import app.models.ward  # noqa: F401

_background_tasks: list[Any] = []
_stop_event: asyncio.Event | None = None

import asyncio  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _background_tasks, _stop_event
    _stop_event = asyncio.Event()
    # Start background workers.
    _background_tasks = [
        asyncio.create_task(run_escalation_worker(_stop_event)),
        asyncio.create_task(run_medication_scheduler(_stop_event)),
    ]
    yield
    # Shutdown: stop workers.
    _stop_event.set()
    for task in _background_tasks:
        task.cancel()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(beds.router)
app.include_router(robots.router)
app.include_router(vitals.router)
app.include_router(patients.router)
app.include_router(alerts.router)
app.include_router(tasks.router)
app.include_router(audit.router)
app.include_router(care_plans.router)
app.include_router(medication_events.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
