from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel


class CourseOut(BaseModel):
    id: uuid.UUID
    language_from: str
    language_to: str
    title: str
    description: str | None = None
    total_units: int
    thumbnail_url: str | None = None
    content_version: str

    model_config = {"from_attributes": True}


class CourseListResponse(BaseModel):
    courses: list[CourseOut]


class LessonSummaryOut(BaseModel):
    id: str
    order: int
    title: str
    type: str
    status: str  # "locked" | "available" | "completed"
    best_score: int | None = None
    exercise_count: int


class UnitOut(BaseModel):
    order: int
    title: str
    lessons: list[LessonSummaryOut]


class EnrollmentOut(BaseModel):
    enrolled_at: datetime
    current_unit: int
    current_lesson: int
    overall_progress: float


class CourseDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    units: list[UnitOut]
    enrollment: EnrollmentOut | None = None


class EnrollResponse(BaseModel):
    enrollment_id: uuid.UUID
    enrolled_at: datetime
