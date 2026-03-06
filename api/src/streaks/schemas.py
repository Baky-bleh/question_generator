from __future__ import annotations

from pydantic import BaseModel


class StreakResponse(BaseModel):
    current: int
    longest: int
    today_completed: bool
    freeze_available: bool
    freeze_remaining: int
