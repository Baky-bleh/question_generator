from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base, TimestampMixin


class SRSItem(Base, TimestampMixin):
    __tablename__ = "srs_items"
    __table_args__ = (
        UniqueConstraint("user_id", "concept_id", name="uq_user_concept"),
        Index("ix_srs_items_user_next_review", "user_id", "next_review_at"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), index=True, nullable=False
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("courses.id"), nullable=False
    )
    concept_id: Mapped[str] = mapped_column(String(100), nullable=False)
    concept_type: Mapped[str] = mapped_column(String(20), nullable=False)
    ease_factor: Mapped[float] = mapped_column(Float, nullable=False, server_default="2.5")
    interval_days: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    repetition_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    next_review_at: Mapped[datetime] = mapped_column(nullable=False, index=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(nullable=True)
