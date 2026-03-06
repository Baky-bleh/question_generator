from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.srs.models import SRSItem
from src.srs.schemas import ReviewItemOut, ReviewNextResponse, ReviewSubmitResponse
from src.srs.sm2 import sm2_algorithm


class SRSService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_due_items(
        self,
        user_id: uuid.UUID,
        course_id: uuid.UUID | None = None,
        limit: int = 20,
    ) -> ReviewNextResponse:
        """Get items due for review."""
        now = datetime.now(timezone.utc)

        stmt = (
            select(SRSItem)
            .where(
                SRSItem.user_id == user_id,
                SRSItem.next_review_at <= now,
            )
            .order_by(SRSItem.next_review_at.asc())
            .limit(limit)
        )

        if course_id is not None:
            stmt = stmt.where(SRSItem.course_id == course_id)

        result = await self._db.execute(stmt)
        items = list(result.scalars().all())

        # Count total due
        count_stmt = select(func.count()).select_from(SRSItem).where(
            SRSItem.user_id == user_id,
            SRSItem.next_review_at <= now,
        )
        if course_id is not None:
            count_stmt = count_stmt.where(SRSItem.course_id == course_id)

        total_due = (await self._db.execute(count_stmt)).scalar() or 0

        return ReviewNextResponse(
            items=[
                ReviewItemOut(
                    concept_id=item.concept_id,
                    concept_type=item.concept_type,
                    content_url="",
                    ease_factor=item.ease_factor,
                    interval_days=item.interval_days,
                    review_count=item.repetition_count,
                )
                for item in items
            ],
            total_due=total_due,
        )

    async def submit_review(
        self,
        user_id: uuid.UUID,
        concept_id: str,
        quality: int,
    ) -> ReviewSubmitResponse:
        """Submit a review result and update SRS state using SM-2."""
        stmt = select(SRSItem).where(
            SRSItem.user_id == user_id,
            SRSItem.concept_id == concept_id,
        )
        result = await self._db.execute(stmt)
        item = result.scalar_one_or_none()

        if item is None:
            from src.core.exceptions import NotFoundError
            raise NotFoundError(f"SRS item not found for concept: {concept_id}")

        sm2_result = sm2_algorithm(
            quality=quality,
            ease_factor=item.ease_factor,
            interval=item.interval_days,
            repetitions=item.repetition_count,
        )

        now = datetime.now(timezone.utc)
        next_review = now + timedelta(days=sm2_result.interval)

        item.ease_factor = sm2_result.ease_factor
        item.interval_days = sm2_result.interval
        item.repetition_count = sm2_result.repetitions
        item.next_review_at = next_review
        item.last_reviewed_at = now

        await self._db.flush()

        return ReviewSubmitResponse(
            new_interval_days=sm2_result.interval,
            new_ease_factor=sm2_result.ease_factor,
            next_review_at=next_review,
        )
