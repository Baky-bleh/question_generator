from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class VideoLessonOut(BaseModel):
    id: str
    title: str
    description: str | None = None
    video_url: str
    video_duration_seconds: int
    thumbnail_url: str | None = None
    teacher_name: str | None = None
    quiz_id: str | None = None
    watch_threshold_percent: int

    model_config = {"from_attributes": True}


class VideoProgressOut(BaseModel):
    watch_percent: int
    last_position_seconds: int
    completed: bool
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class VideoLessonDetailResponse(BaseModel):
    """Full video lesson with user progress and quiz unlock status."""

    video_lesson: VideoLessonOut
    progress: VideoProgressOut | None = None
    quiz_unlocked: bool = False


class VideoProgressUpdateRequest(BaseModel):
    position_seconds: int
    watch_percent: int  # 0-100


class VideoProgressResponse(BaseModel):
    watch_percent: int
    last_position_seconds: int
    completed: bool
    quiz_unlocked: bool


class VideoLessonSummaryOut(BaseModel):
    """Summary for course detail response."""

    id: str
    order: int
    title: str
    duration_seconds: int
    thumbnail_url: str | None = None
    watch_percent: int = 0
    quiz_unlocked: bool = False
    quiz_id: str | None = None
