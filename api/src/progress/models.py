from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base, TimestampMixin


class UserCourseEnrollment(Base, TimestampMixin):
    __tablename__ = "user_course_enrollments"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id"), index=True, nullable=False
    )
    current_unit_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    current_lesson_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    enrolled_at: Mapped[datetime] = mapped_column(nullable=False)


class LessonCompletion(Base, TimestampMixin):
    __tablename__ = "lesson_completions"
    __table_args__ = (
        Index("ix_lesson_completions_user_lesson", "user_id", "lesson_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id"), nullable=False
    )
    lesson_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    unit_order: Mapped[int] = mapped_column(Integer, nullable=False)
    lesson_order: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    xp_earned: Mapped[int] = mapped_column(Integer, nullable=False)
    time_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    mistakes: Mapped[int] = mapped_column(Integer, nullable=False)
    is_perfect: Mapped[bool] = mapped_column(Boolean, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(nullable=False)


class XPEvent(Base):
    __tablename__ = "xp_events"
    __table_args__ = (
        Index("ix_xp_events_user_created", "user_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    source: Mapped[str] = mapped_column(String(30), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, index=True,
        server_default="now()",
    )


class Achievement(Base):
    __tablename__ = "achievements"
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_type", name="uq_user_achievement"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    achievement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(nullable=False)
