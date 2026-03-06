from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class ReviewItemOut(BaseModel):
    concept_id: str
    concept_type: str
    content_url: str
    ease_factor: float
    interval_days: int
    review_count: int


class ReviewNextResponse(BaseModel):
    items: list[ReviewItemOut]
    total_due: int


class ReviewSubmitRequest(BaseModel):
    concept_id: str
    quality: int = Field(..., ge=0, le=5)


class ReviewSubmitResponse(BaseModel):
    new_interval_days: int
    new_ease_factor: float
    next_review_at: datetime
