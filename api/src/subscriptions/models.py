from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base, TimestampMixin


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    platform: Mapped[str | None] = mapped_column(String(20), nullable=True)
    product_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    revenuecat_id: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    free_trial_expires_at: Mapped[datetime] = mapped_column(nullable=False)
    current_period_starts_at: Mapped[datetime | None] = mapped_column(nullable=True)
    current_period_ends_at: Mapped[datetime | None] = mapped_column(nullable=True)
