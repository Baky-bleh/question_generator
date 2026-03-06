from __future__ import annotations

import uuid
from datetime import date, datetime

from zoneinfo import ZoneInfo

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.streaks.models import Streak
from src.streaks.schemas import StreakResponse

STREAK_KEY_PREFIX = "streak"


def _user_local_date(timezone: str) -> date:
    """Get the current date in the user's local timezone."""
    tz = ZoneInfo(timezone)
    return datetime.now(tz).date()


class StreakService:
    def __init__(self, db: AsyncSession, redis: Redis) -> None:
        self._db = db
        self._redis = redis

    def _redis_key(self, user_id: uuid.UUID) -> str:
        return f"{STREAK_KEY_PREFIX}:{user_id}"

    async def get_streak(self, user_id: uuid.UUID) -> StreakResponse:
        """Get streak info. Redis-first, DB fallback."""
        key = self._redis_key(user_id)
        cached = await self._redis.hgetall(key)

        if cached:
            return StreakResponse(
                current=int(cached["count"]),
                longest=int(cached.get("longest", cached["count"])),
                today_completed=cached.get("today_completed", "0") == "1",
                freeze_available=int(cached.get("freeze_remaining", "0")) > 0,
                freeze_remaining=int(cached.get("freeze_remaining", "0")),
            )

        streak = await self._get_or_create_streak(user_id)
        await self._cache_streak(user_id, streak)

        return StreakResponse(
            current=streak.current_count,
            longest=streak.longest_count,
            today_completed=False,
            freeze_available=streak.freeze_remaining > 0,
            freeze_remaining=streak.freeze_remaining,
        )

    async def check_in(
        self, user_id: uuid.UUID, user_timezone: str
    ) -> StreakResponse:
        """Record daily activity. Timezone-aware streak tracking.

        Uses the user's local date (NOT UTC) to determine if this is
        a new day. Auto-consumes a streak freeze if the user missed
        exactly one day and has freezes available.
        """
        today = _user_local_date(user_timezone)
        streak = await self._get_or_create_streak(user_id)

        is_new_record = False

        if streak.last_activity_date == today:
            # Already checked in today — just return current state
            await self._cache_streak(user_id, streak, today_completed=True)
            return StreakResponse(
                current=streak.current_count,
                longest=streak.longest_count,
                today_completed=True,
                freeze_available=streak.freeze_remaining > 0,
                freeze_remaining=streak.freeze_remaining,
            )

        if streak.last_activity_date is not None:
            days_gap = (today - streak.last_activity_date).days

            if days_gap == 1:
                # Consecutive day — extend streak
                streak.current_count += 1
            elif days_gap == 2 and streak.freeze_remaining > 0:
                # Missed exactly 1 day with freeze available — auto-consume freeze
                streak.freeze_remaining -= 1
                streak.freeze_used_today = True
                streak.current_count += 1
            else:
                # Streak broken
                streak.current_count = 1
        else:
            # First ever activity
            streak.current_count = 1

        streak.last_activity_date = today

        if streak.current_count > streak.longest_count:
            streak.longest_count = streak.current_count
            is_new_record = True

        await self._db.flush()
        await self._cache_streak(user_id, streak, today_completed=True)

        return StreakResponse(
            current=streak.current_count,
            longest=streak.longest_count,
            today_completed=True,
            freeze_available=streak.freeze_remaining > 0,
            freeze_remaining=streak.freeze_remaining,
        )

    async def _get_or_create_streak(self, user_id: uuid.UUID) -> Streak:
        stmt = select(Streak).where(Streak.user_id == user_id)
        result = await self._db.execute(stmt)
        streak = result.scalar_one_or_none()

        if streak is None:
            streak = Streak(user_id=user_id)
            self._db.add(streak)
            await self._db.flush()

        return streak

    async def _cache_streak(
        self,
        user_id: uuid.UUID,
        streak: Streak,
        today_completed: bool = False,
    ) -> None:
        key = self._redis_key(user_id)
        await self._redis.hset(
            key,
            mapping={
                "count": str(streak.current_count),
                "longest": str(streak.longest_count),
                "last_date": streak.last_activity_date.isoformat() if streak.last_activity_date else "",
                "freeze_remaining": str(streak.freeze_remaining),
                "today_completed": "1" if today_completed else "0",
            },
        )
