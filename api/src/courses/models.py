from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base, TimestampMixin


class Course(Base, TimestampMixin):
    __tablename__ = "courses"
    __table_args__ = (
        UniqueConstraint("language_from", "language_to", name="uq_course_language_pair"),
    )

    language_from: Mapped[str] = mapped_column(String(10), nullable=False)
    language_to: Mapped[str] = mapped_column(String(10), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_version: Mapped[str] = mapped_column(String(50), nullable=False)
    total_units: Mapped[int] = mapped_column(Integer, nullable=False)
    total_lessons: Mapped[int] = mapped_column(Integer, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
