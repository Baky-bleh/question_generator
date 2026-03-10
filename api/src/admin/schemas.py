from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


# --- User management ---


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(pattern="^(student|teacher|admin)$")


class UserSummaryOut(BaseModel):
    id: UUID
    email: str
    display_name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    users: list[UserSummaryOut]
    total: int


# --- Video lesson management ---


class VideoLessonCreateRequest(BaseModel):
    id: str = Field(max_length=100, description="Unique lesson ID (slug)")
    course_id: UUID
    unit_order: int = Field(ge=1)
    lesson_order: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    video_url: str = Field(max_length=500)
    video_duration_seconds: int = Field(ge=1)
    thumbnail_url: str | None = Field(None, max_length=500)
    teacher_name: str | None = Field(None, max_length=100)
    quiz_id: str | None = Field(None, max_length=100)
    watch_threshold_percent: int = Field(default=80, ge=1, le=100)


class VideoLessonUpdateRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    video_url: str | None = Field(None, max_length=500)
    video_duration_seconds: int | None = Field(None, ge=1)
    thumbnail_url: str | None = Field(None, max_length=500)
    teacher_name: str | None = Field(None, max_length=100)
    quiz_id: str | None = Field(None, max_length=100)
    watch_threshold_percent: int | None = Field(None, ge=1, le=100)


class VideoLessonOut(BaseModel):
    id: str
    course_id: UUID
    unit_order: int
    lesson_order: int
    title: str
    description: str | None
    video_url: str
    video_duration_seconds: int
    thumbnail_url: str | None
    teacher_name: str | None
    quiz_id: str | None
    watch_threshold_percent: int
    created_at: datetime

    model_config = {"from_attributes": True}


class VideoLessonListResponse(BaseModel):
    video_lessons: list[VideoLessonOut]
    total: int


# --- Course management ---


class CourseCreateRequest(BaseModel):
    language_from: str = Field(max_length=10)
    language_to: str = Field(max_length=10)
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    course_type: str = Field(default="math", pattern="^(language|math)$")
    content_mode: str = Field(default="video_quiz", pattern="^(exercise|video_quiz)$")
    total_units: int = Field(ge=1)
    total_lessons: int = Field(ge=0)
    content_version: str = Field(default="1.0", max_length=50)
    is_published: bool = False


class VideoUploadResponse(BaseModel):
    filename: str
    url: str
    size_bytes: int


class CourseOut(BaseModel):
    id: UUID
    language_from: str
    language_to: str
    title: str
    description: str | None
    course_type: str
    content_mode: str
    total_units: int
    total_lessons: int
    content_version: str
    is_published: bool
    created_at: datetime

    model_config = {"from_attributes": True}
