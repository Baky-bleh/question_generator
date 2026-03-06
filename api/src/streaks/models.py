from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base, TimestampMixin


class Streak(Base, TimestampMixin):
    __tablename__ = "streaks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    current_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    longest_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    freeze_remaining: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    freeze_used_today: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
