from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from src.courses.models import Course
from src.progress.models import UserCourseEnrollment
from src.progress.schemas import LessonCompleteRequest
from src.progress.service import ProgressService


@pytest.fixture
async def progress_service(db_session, test_redis):
    return ProgressService(db_session, test_redis)


@pytest.fixture
async def enrolled_user(db_session, create_test_user):
    user = await create_test_user(email="progress_svc@test.com")
    course = Course(
        id=uuid.uuid4(),
        language_from="en",
        language_to="es",
        title="Spanish",
        content_version="v1.0.0",
        total_units=2,
        total_lessons=10,
        is_published=True,
    )
    db_session.add(course)
    await db_session.flush()

    enrollment = UserCourseEnrollment(
        user_id=user.id,
        course_id=course.id,
        current_unit_order=1,
        current_lesson_order=1,
        enrolled_at=datetime.now(timezone.utc),
    )
    db_session.add(enrollment)
    await db_session.flush()
    return user, course, enrollment


class TestCompleteLesson:
    @pytest.mark.asyncio
    async def test_returns_xp_breakdown(
        self, progress_service, enrolled_user
    ) -> None:
        user, course, _ = enrolled_user
        request = LessonCompleteRequest(
            score=85, time_seconds=200, mistakes=2, perfect=False
        )
        result = await progress_service.complete_lesson(
            user_id=user.id,
            lesson_id="u1-l1",
            course_id=course.id,
            request=request,
            user_timezone="UTC",
        )
        assert result.xp_earned > 0
        assert result.xp_breakdown.base == 10
        assert result.streak.current >= 1
        assert result.achievements_unlocked == []

    @pytest.mark.asyncio
    async def test_perfect_score_gives_bonus(
        self, progress_service, enrolled_user
    ) -> None:
        user, course, _ = enrolled_user
        request = LessonCompleteRequest(
            score=100, time_seconds=200, mistakes=0, perfect=True
        )
        result = await progress_service.complete_lesson(
            user_id=user.id,
            lesson_id="u1-l2",
            course_id=course.id,
            request=request,
            user_timezone="UTC",
        )
        assert result.xp_breakdown.perfect_bonus == 5


class TestGetProgressSummary:
    @pytest.mark.asyncio
    async def test_returns_summary(
        self, progress_service, enrolled_user
    ) -> None:
        user, _, _ = enrolled_user
        result = await progress_service.get_progress_summary(user.id)
        assert result.total_xp >= 0
        assert result.level >= 1
        assert isinstance(result.courses, list)
        assert result.today.lessons_completed >= 0

    @pytest.mark.asyncio
    async def test_empty_user_returns_defaults(
        self, progress_service, create_test_user
    ) -> None:
        user = await create_test_user(email="empty_progress@test.com")
        result = await progress_service.get_progress_summary(user.id)
        assert result.total_xp == 0
        assert result.level == 1
        assert result.courses == []


class TestGetCourseProgress:
    @pytest.mark.asyncio
    async def test_returns_course_progress(
        self, progress_service, enrolled_user
    ) -> None:
        user, course, _ = enrolled_user
        result = await progress_service.get_course_progress(user.id, course.id)
        assert result.course_id == course.id
        assert result.units_total == 2
        assert result.lessons_total == 10
        assert result.lessons_completed >= 0

    @pytest.mark.asyncio
    async def test_nonexistent_course_raises(
        self, progress_service, create_test_user
    ) -> None:
        user = await create_test_user(email="nocourse@test.com")
        from src.core.exceptions import NotFoundError
        with pytest.raises(NotFoundError):
            await progress_service.get_course_progress(user.id, uuid.uuid4())
