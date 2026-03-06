from __future__ import annotations

import uuid
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import Settings
from src.core.exceptions import NotFoundError
from src.courses.models import Course
from src.lessons.content_loader import ContentLoader
from src.lessons.service import LessonService


def _make_content_loader() -> ContentLoader:
    settings = MagicMock()
    settings.CONTENT_DIR = str(Path(__file__).resolve().parents[3] / "content")
    return ContentLoader(settings)


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


@pytest.fixture
def content_loader() -> ContentLoader:
    return _make_content_loader()


@pytest.fixture
def settings() -> Settings:
    return MagicMock(spec=Settings)


class TestGetLesson:
    async def test_get_existing_lesson(
        self,
        db_session: AsyncSession,
        course: Course,
        content_loader: ContentLoader,
        settings: Settings,
    ) -> None:
        service = LessonService(db_session, content_loader, settings)
        result = await service.get_lesson("es-en-u1-l1", course.id)

        assert result.id == "es-en-u1-l1"
        assert result.title == "Greetings"
        assert result.exercise_count == 8
        assert result.estimated_minutes == 5

    async def test_get_nonexistent_lesson(
        self,
        db_session: AsyncSession,
        course: Course,
        content_loader: ContentLoader,
        settings: Settings,
    ) -> None:
        service = LessonService(db_session, content_loader, settings)
        with pytest.raises(NotFoundError, match="Lesson not found"):
            await service.get_lesson("nonexistent", course.id)

    async def test_get_lesson_nonexistent_course(
        self,
        db_session: AsyncSession,
        content_loader: ContentLoader,
        settings: Settings,
    ) -> None:
        service = LessonService(db_session, content_loader, settings)
        with pytest.raises(NotFoundError, match="Course not found"):
            await service.get_lesson("es-en-u1-l1", uuid.uuid4())


class TestSubmitAnswer:
    async def test_correct_multiple_choice(
        self,
        db_session: AsyncSession,
        course: Course,
        content_loader: ContentLoader,
        settings: Settings,
        create_test_user,
    ) -> None:
        user = await create_test_user()
        service = LessonService(db_session, content_loader, settings)
        result = await service.submit_answer(
            "es-en-u1-l1", "es-en-u1-l1-e1", "1", user.id, course.id
        )

        assert result.correct is True
        assert result.correct_answer == "Hola"
        assert result.xp_earned == 2

    async def test_wrong_multiple_choice(
        self,
        db_session: AsyncSession,
        course: Course,
        content_loader: ContentLoader,
        settings: Settings,
        create_test_user,
    ) -> None:
        user = await create_test_user()
        service = LessonService(db_session, content_loader, settings)
        result = await service.submit_answer(
            "es-en-u1-l1", "es-en-u1-l1-e1", "0", user.id, course.id
        )

        assert result.correct is False
        assert result.xp_earned == 0

    async def test_correct_translation(
        self,
        db_session: AsyncSession,
        course: Course,
        content_loader: ContentLoader,
        settings: Settings,
        create_test_user,
    ) -> None:
        user = await create_test_user()
        service = LessonService(db_session, content_loader, settings)
        result = await service.submit_answer(
            "es-en-u1-l1", "es-en-u1-l1-e2", "Buenos días", user.id, course.id
        )

        assert result.correct is True
        assert result.xp_earned == 2

    async def test_nonexistent_exercise(
        self,
        db_session: AsyncSession,
        course: Course,
        content_loader: ContentLoader,
        settings: Settings,
        create_test_user,
    ) -> None:
        user = await create_test_user()
        service = LessonService(db_session, content_loader, settings)
        with pytest.raises(NotFoundError, match="Exercise not found"):
            await service.submit_answer(
                "es-en-u1-l1", "nonexistent", "answer", user.id, course.id
            )

    async def test_nonexistent_lesson(
        self,
        db_session: AsyncSession,
        course: Course,
        content_loader: ContentLoader,
        settings: Settings,
        create_test_user,
    ) -> None:
        user = await create_test_user()
        service = LessonService(db_session, content_loader, settings)
        with pytest.raises(NotFoundError, match="Lesson not found"):
            await service.submit_answer(
                "nonexistent", "e1", "answer", user.id, course.id
            )
