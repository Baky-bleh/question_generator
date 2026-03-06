from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from src.auth.deps import get_current_user
from src.courses.models import Course
from src.progress.models import UserCourseEnrollment


@pytest.fixture
async def auth_client_enrolled(async_client, create_test_user, db_session):
    user = await create_test_user(email="progress_router@test.com")

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

    async def override_user():
        return user

    async_client._transport.app.dependency_overrides[get_current_user] = override_user
    yield async_client, user, course
    async_client._transport.app.dependency_overrides.pop(get_current_user, None)


class TestCompleteLessonRouter:
    @pytest.mark.asyncio
    async def test_complete_lesson_returns_200(self, auth_client_enrolled) -> None:
        client, user, course = auth_client_enrolled
        response = await client.post(
            f"/api/v1/lessons/u1-l1/complete?course_id={course.id}",
            json={"score": 90, "time_seconds": 180, "mistakes": 1, "perfect": False},
        )
        assert response.status_code == 200
        data = response.json()
        assert "xp_earned" in data
        assert "xp_breakdown" in data
        assert "streak" in data
        assert data["achievements_unlocked"] == []

    @pytest.mark.asyncio
    async def test_complete_lesson_validation(self, auth_client_enrolled) -> None:
        client, _, course = auth_client_enrolled
        response = await client.post(
            f"/api/v1/lessons/test/complete?course_id={course.id}",
            json={"score": 150, "time_seconds": 180, "mistakes": 1, "perfect": False},
        )
        assert response.status_code == 422


class TestProgressMeRouter:
    @pytest.mark.asyncio
    async def test_get_progress_me(self, auth_client_enrolled) -> None:
        client, _, _ = auth_client_enrolled
        response = await client.get("/api/v1/progress/me")
        assert response.status_code == 200
        data = response.json()
        assert "total_xp" in data
        assert "level" in data
        assert "courses" in data
        assert "today" in data


class TestCourseProgressRouter:
    @pytest.mark.asyncio
    async def test_get_course_progress(self, auth_client_enrolled) -> None:
        client, _, course = auth_client_enrolled
        response = await client.get(f"/api/v1/progress/me/course/{course.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["course_id"] == str(course.id)
        assert "units_total" in data

    @pytest.mark.asyncio
    async def test_nonexistent_course(self, auth_client_enrolled) -> None:
        client, _, _ = auth_client_enrolled
        response = await client.get(f"/api/v1/progress/me/course/{uuid.uuid4()}")
        assert response.status_code == 404
