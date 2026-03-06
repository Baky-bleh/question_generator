from __future__ import annotations

import uuid
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import ConflictError, NotFoundError
from src.courses.models import Course
from src.courses.service import CourseService
from src.lessons.content_loader import ContentLoader
from src.progress.models import LessonCompletion, UserCourseEnrollment


def _make_course(
    course_id: uuid.UUID | None = None,
    is_published: bool = True,
) -> Course:
    return Course(
        id=course_id or uuid.uuid4(),
        language_from="en",
        language_to="es",
        title="Spanish for English Speakers",
        description="Learn Spanish",
        content_version="v1.0.0",
        total_units=2,
        total_lessons=10,
        is_published=is_published,
    )


def _make_content_loader() -> ContentLoader:
    settings = MagicMock()
    settings.CONTENT_DIR = str(Path(__file__).resolve().parents[3] / "content")
    return ContentLoader(settings)


@pytest.fixture
async def course(db_session: AsyncSession) -> Course:
    c = _make_course()
    db_session.add(c)
    await db_session.flush()
    return c


@pytest.fixture
def content_loader() -> ContentLoader:
    return _make_content_loader()


class TestListCourses:
    async def test_returns_published_courses(
        self, db_session: AsyncSession, content_loader: ContentLoader
    ) -> None:
        published = _make_course(is_published=True)
        unpublished = _make_course(
            course_id=uuid.uuid4(),
            is_published=False,
        )
        # Make unpublished have a different language pair to avoid unique constraint
        unpublished.language_from = "es"
        unpublished.language_to = "en"
        db_session.add_all([published, unpublished])
        await db_session.flush()

        service = CourseService(db_session, content_loader)
        courses = await service.list_courses()

        assert len(courses) == 1
        assert courses[0].title == "Spanish for English Speakers"

    async def test_returns_empty_when_no_courses(
        self, db_session: AsyncSession, content_loader: ContentLoader
    ) -> None:
        service = CourseService(db_session, content_loader)
        courses = await service.list_courses()
        assert courses == []


class TestEnroll:
    async def test_successful_enrollment(
        self,
        db_session: AsyncSession,
        course: Course,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        service = CourseService(db_session, content_loader)
        result = await service.enroll(course.id, user.id)

        assert result.enrollment_id is not None
        assert result.enrolled_at is not None

    async def test_duplicate_enrollment_raises_conflict(
        self,
        db_session: AsyncSession,
        course: Course,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        service = CourseService(db_session, content_loader)
        await service.enroll(course.id, user.id)

        with pytest.raises(ConflictError, match="Already enrolled"):
            await service.enroll(course.id, user.id)

    async def test_enroll_nonexistent_course_raises(
        self,
        db_session: AsyncSession,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        service = CourseService(db_session, content_loader)

        with pytest.raises(NotFoundError, match="Course not found"):
            await service.enroll(uuid.uuid4(), user.id)


class TestGetCourseDetail:
    async def test_course_not_found(
        self,
        db_session: AsyncSession,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        service = CourseService(db_session, content_loader)

        with pytest.raises(NotFoundError):
            await service.get_course_detail(uuid.uuid4(), user.id)

    async def test_returns_units_and_lessons(
        self,
        db_session: AsyncSession,
        course: Course,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        # Enroll user first
        enrollment = UserCourseEnrollment(
            user_id=user.id,
            course_id=course.id,
            current_unit_order=1,
            current_lesson_order=1,
            enrolled_at=datetime.now(timezone.utc),
        )
        db_session.add(enrollment)
        await db_session.flush()

        service = CourseService(db_session, content_loader)
        detail = await service.get_course_detail(course.id, user.id)

        assert detail.id == course.id
        assert len(detail.units) == 2
        assert detail.units[0].title == "Basics 1"
        assert len(detail.units[0].lessons) == 5

    async def test_first_lesson_is_available_when_enrolled(
        self,
        db_session: AsyncSession,
        course: Course,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        enrollment = UserCourseEnrollment(
            user_id=user.id,
            course_id=course.id,
            current_unit_order=1,
            current_lesson_order=1,
            enrolled_at=datetime.now(timezone.utc),
        )
        db_session.add(enrollment)
        await db_session.flush()

        service = CourseService(db_session, content_loader)
        detail = await service.get_course_detail(course.id, user.id)

        first_lesson = detail.units[0].lessons[0]
        assert first_lesson.status == "available"

    async def test_completed_lesson_shows_completed(
        self,
        db_session: AsyncSession,
        course: Course,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        enrollment = UserCourseEnrollment(
            user_id=user.id,
            course_id=course.id,
            current_unit_order=1,
            current_lesson_order=2,
            enrolled_at=datetime.now(timezone.utc),
        )
        completion = LessonCompletion(
            user_id=user.id,
            course_id=course.id,
            lesson_id="es-en-u1-l1",
            unit_order=1,
            lesson_order=1,
            score=95,
            xp_earned=12,
            time_seconds=180,
            mistakes=1,
            is_perfect=False,
            completed_at=datetime.now(timezone.utc),
        )
        db_session.add_all([enrollment, completion])
        await db_session.flush()

        service = CourseService(db_session, content_loader)
        detail = await service.get_course_detail(course.id, user.id)

        first_lesson = detail.units[0].lessons[0]
        assert first_lesson.status == "completed"
        assert first_lesson.best_score == 95

        second_lesson = detail.units[0].lessons[1]
        assert second_lesson.status == "available"

    async def test_enrollment_info_included(
        self,
        db_session: AsyncSession,
        course: Course,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        enrollment = UserCourseEnrollment(
            user_id=user.id,
            course_id=course.id,
            current_unit_order=1,
            current_lesson_order=1,
            enrolled_at=datetime.now(timezone.utc),
        )
        db_session.add(enrollment)
        await db_session.flush()

        service = CourseService(db_session, content_loader)
        detail = await service.get_course_detail(course.id, user.id)

        assert detail.enrollment is not None
        assert detail.enrollment.current_unit == 1
        assert detail.enrollment.current_lesson == 1
        assert detail.enrollment.overall_progress == 0.0

    async def test_no_enrollment_returns_null(
        self,
        db_session: AsyncSession,
        course: Course,
        create_test_user,
        content_loader: ContentLoader,
    ) -> None:
        user = await create_test_user()
        service = CourseService(db_session, content_loader)
        detail = await service.get_course_detail(course.id, user.id)

        assert detail.enrollment is None
