from __future__ import annotations

import uuid
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.config import Settings
from src.core.deps import get_settings
from src.courses.models import Course

CONTENT_DIR = str(Path(__file__).resolve().parents[3] / "content")


@pytest.fixture
async def test_user(create_test_user) -> User:
    return await create_test_user()


@pytest.fixture
async def authenticated_client(async_client: AsyncClient, test_user: User) -> AsyncClient:
    app = async_client._transport.app  # type: ignore[attr-defined]

    async def override_get_current_user() -> User:
        return test_user

    def override_get_settings() -> Settings:
        s = MagicMock(spec=Settings)
        s.CONTENT_DIR = CONTENT_DIR
        return s

    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_settings] = override_get_settings
    return async_client


@pytest.fixture
async def course(db_session: AsyncSession) -> Course:
    c = Course(
        id=uuid.uuid4(),
        language_from="en",
        language_to="es",
        title="Spanish for English Speakers",
        description="Learn Spanish",
        content_version="v1.0.0",
        total_units=2,
        total_lessons=10,
        is_published=True,
    )
    db_session.add(c)
    await db_session.flush()
    return c


class TestGetLesson:
    async def test_get_lesson_returns_200(
        self, authenticated_client: AsyncClient, course: Course
    ) -> None:
        response = await authenticated_client.get(
            "/api/v1/lessons/es-en-u1-l1",
            params={"course_id": str(course.id)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "es-en-u1-l1"
        assert data["title"] == "Greetings"
        assert data["exercise_count"] == 8

    async def test_get_lesson_nonexistent_returns_404(
        self, authenticated_client: AsyncClient, course: Course
    ) -> None:
        response = await authenticated_client.get(
            "/api/v1/lessons/nonexistent",
            params={"course_id": str(course.id)},
        )
        assert response.status_code == 404

    async def test_get_lesson_unauthenticated(
        self, async_client: AsyncClient, course: Course
    ) -> None:
        response = await async_client.get(
            "/api/v1/lessons/es-en-u1-l1",
            params={"course_id": str(course.id)},
        )
        assert response.status_code in (401, 403)


class TestSubmitExercise:
    async def test_correct_answer_returns_200(
        self, authenticated_client: AsyncClient, course: Course
    ) -> None:
        response = await authenticated_client.post(
            "/api/v1/lessons/es-en-u1-l1/submit",
            params={"course_id": str(course.id)},
            json={
                "exercise_id": "es-en-u1-l1-e1",
                "answer": "1",
                "time_seconds": 5,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["correct"] is True
        assert data["xp_earned"] == 2

    async def test_wrong_answer_returns_200(
        self, authenticated_client: AsyncClient, course: Course
    ) -> None:
        response = await authenticated_client.post(
            "/api/v1/lessons/es-en-u1-l1/submit",
            params={"course_id": str(course.id)},
            json={
                "exercise_id": "es-en-u1-l1-e1",
                "answer": "0",
                "time_seconds": 5,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["correct"] is False
        assert data["xp_earned"] == 0

    async def test_nonexistent_exercise_returns_404(
        self, authenticated_client: AsyncClient, course: Course
    ) -> None:
        response = await authenticated_client.post(
            "/api/v1/lessons/es-en-u1-l1/submit",
            params={"course_id": str(course.id)},
            json={
                "exercise_id": "nonexistent",
                "answer": "0",
                "time_seconds": 5,
            },
        )
        assert response.status_code == 404

    async def test_submit_unauthenticated(
        self, async_client: AsyncClient, course: Course
    ) -> None:
        response = await async_client.post(
            "/api/v1/lessons/es-en-u1-l1/submit",
            params={"course_id": str(course.id)},
            json={
                "exercise_id": "es-en-u1-l1-e1",
                "answer": "1",
                "time_seconds": 5,
            },
        )
        assert response.status_code in (401, 403)
