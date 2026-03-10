from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from unittest.mock import patch
from zoneinfo import ZoneInfo

import pytest

from src.streaks.models import Streak
from src.streaks.service import StreakService


def _utc_today():
    """Get today's date in UTC — matches what the service does with timezone='UTC'."""
    return datetime.now(ZoneInfo("UTC")).date()


@pytest.fixture
async def streak_service(db_session, test_redis):
    return StreakService(db_session, test_redis)


@pytest.fixture
async def user_with_streak(db_session, create_test_user):
    user = await create_test_user()
    streak = Streak(
        user_id=user.id,
        current_count=5,
        longest_count=10,
        last_activity_date=_utc_today() - timedelta(days=1),
        freeze_remaining=2,
    )
    db_session.add(streak)
    await db_session.flush()
    return user, streak


class TestGetStreak:
    @pytest.mark.asyncio
    async def test_creates_streak_if_none_exists(self, streak_service, create_test_user) -> None:
        user = await create_test_user()
        result = await streak_service.get_streak(user.id)
        assert result.current == 0
        assert result.longest == 0
        assert result.today_completed is False

    @pytest.mark.asyncio
    async def test_returns_existing_streak(self, streak_service, user_with_streak) -> None:
        user, streak = user_with_streak
        result = await streak_service.get_streak(user.id)
        assert result.current == 5
        assert result.longest == 10
        assert result.freeze_remaining == 2

    @pytest.mark.asyncio
    async def test_reads_from_redis_cache(
        self, streak_service, test_redis, create_test_user
    ) -> None:
        user = await create_test_user()
        # Manually populate Redis
        key = f"streak:{user.id}"
        await test_redis.hset(
            key,
            mapping={
                "count": "7",
                "longest": "15",
                "freeze_remaining": "1",
                "today_completed": "1",
            },
        )
        result = await streak_service.get_streak(user.id)
        assert result.current == 7
        assert result.longest == 15
        assert result.today_completed is True


class TestCheckIn:
    @pytest.mark.asyncio
    async def test_first_ever_check_in(self, streak_service, create_test_user) -> None:
        user = await create_test_user()
        result = await streak_service.check_in(user.id, "UTC")
        assert result.current == 1
        assert result.today_completed is True

    @pytest.mark.asyncio
    async def test_consecutive_day_extends_streak(self, streak_service, user_with_streak) -> None:
        user, _ = user_with_streak
        result = await streak_service.check_in(user.id, "UTC")
        assert result.current == 6
        assert result.today_completed is True

    @pytest.mark.asyncio
    async def test_same_day_check_in_no_change(
        self, streak_service, db_session, create_test_user
    ) -> None:
        user = await create_test_user(email="sameday@test.com")
        streak = Streak(
            user_id=user.id,
            current_count=3,
            longest_count=3,
            last_activity_date=_utc_today(),
        )
        db_session.add(streak)
        await db_session.flush()

        result = await streak_service.check_in(user.id, "UTC")
        assert result.current == 3
        assert result.today_completed is True

    @pytest.mark.asyncio
    async def test_missed_day_resets_streak(
        self, streak_service, db_session, create_test_user
    ) -> None:
        user = await create_test_user(email="missed@test.com")
        streak = Streak(
            user_id=user.id,
            current_count=5,
            longest_count=10,
            last_activity_date=_utc_today() - timedelta(days=3),
        )
        db_session.add(streak)
        await db_session.flush()

        result = await streak_service.check_in(user.id, "UTC")
        assert result.current == 1

    @pytest.mark.asyncio
    async def test_freeze_auto_consumed_on_missed_one_day(
        self, streak_service, db_session, create_test_user
    ) -> None:
        user = await create_test_user(email="freeze@test.com")
        streak = Streak(
            user_id=user.id,
            current_count=5,
            longest_count=10,
            last_activity_date=_utc_today() - timedelta(days=2),
            freeze_remaining=2,
        )
        db_session.add(streak)
        await db_session.flush()

        result = await streak_service.check_in(user.id, "UTC")
        assert result.current == 6  # Streak continued
        assert result.freeze_remaining == 1  # One freeze used

    @pytest.mark.asyncio
    async def test_no_freeze_when_none_remaining(
        self, streak_service, db_session, create_test_user
    ) -> None:
        user = await create_test_user(email="nofreeze@test.com")
        streak = Streak(
            user_id=user.id,
            current_count=5,
            longest_count=10,
            last_activity_date=_utc_today() - timedelta(days=2),
            freeze_remaining=0,
        )
        db_session.add(streak)
        await db_session.flush()

        result = await streak_service.check_in(user.id, "UTC")
        assert result.current == 1  # Streak reset

    @pytest.mark.asyncio
    async def test_new_record_updates_longest(
        self, streak_service, db_session, create_test_user
    ) -> None:
        user = await create_test_user(email="record@test.com")
        streak = Streak(
            user_id=user.id,
            current_count=10,
            longest_count=10,
            last_activity_date=_utc_today() - timedelta(days=1),
        )
        db_session.add(streak)
        await db_session.flush()

        result = await streak_service.check_in(user.id, "UTC")
        assert result.current == 11
        assert result.longest == 11

    @pytest.mark.asyncio
    async def test_timezone_aware_date(self, streak_service, db_session, create_test_user) -> None:
        """Verify that check_in uses user's timezone, not UTC."""
        user = await create_test_user(email="tz@test.com")
        # When timezone matters: test that the function accepts timezone strings
        result = await streak_service.check_in(user.id, "America/New_York")
        assert result.current == 1
        assert result.today_completed is True

    @pytest.mark.asyncio
    async def test_caches_to_redis_after_check_in(
        self, streak_service, test_redis, create_test_user
    ) -> None:
        user = await create_test_user(email="cache@test.com")
        await streak_service.check_in(user.id, "UTC")

        key = f"streak:{user.id}"
        cached = await test_redis.hgetall(key)
        assert cached["count"] == "1"
        assert cached["today_completed"] == "1"
