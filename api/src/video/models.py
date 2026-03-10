from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base, TimestampMixin


class VideoLesson(Base):
    __tablename__ = "video_lessons"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    course_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("courses.id"), index=True)
    unit_order: Mapped[int] = mapped_column(Integer, nullable=False)
    lesson_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str] = mapped_column(String(500), nullable=False)
    video_duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    teacher_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transcript_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    quiz_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    watch_threshold_percent: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="80"
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, server_default=func.now()
    )


class VideoProgress(Base, TimestampMixin):
    __tablename__ = "video_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "video_lesson_id", name="uq_user_video_progress"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    video_lesson_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("video_lessons.id"), index=True
    )
    watch_percent: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    last_position_seconds: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
