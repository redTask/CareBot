from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, field_serializer


class APIModel(BaseModel):
    """Base for response models: datetimes become UTC ISO strings ending in Z."""

    @field_serializer("*", when_used="json", check_fields=False)
    def _serialize_datetime(self, value: object, _info: object) -> object:
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        return value
