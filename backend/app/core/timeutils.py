"""UTC timestamp helpers.

All timestamps are stored in UTC (Postgres ``timestamptz``) and serialized as
ISO-8601 strings with an explicit ``Z`` suffix so the browser can reliably
convert them to the viewer's local time.
"""

from __future__ import annotations

from datetime import datetime, timezone


def utcnow() -> datetime:
    """Current time as an aware UTC datetime (never a naive local value)."""
    return datetime.now(timezone.utc)


def iso_z(value: datetime | None) -> str | None:
    """Serialize a datetime as ``YYYY-MM-DDTHH:MM:SSZ`` (UTC).

    Naive datetimes are assumed to already be UTC (this is how values written
    by older code paths were stored).
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
