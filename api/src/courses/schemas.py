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
    course_type: str = "language"
    content_mode: str = "exercise"

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
    exercise_count: int = 0
    # Video lesson fields (only present for video_quiz courses)
    duration_seconds: int | None = None
    thumbnail_url: str | None = None
    watch_percent: int | None = None
    quiz_unlocked: bool | None = None
    quiz_id: str | None = None


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
