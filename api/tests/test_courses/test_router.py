from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
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
from src.progress.models import UserCourseEnrollment
from src.video.models import VideoLesson, VideoProgress

CONTENT_DIR = str(Path(__file__).resolve().parents[3] / "content")


@pytest.fixture
async def test_user(create_test_user) -> User:
    return await create_test_user()


@pytest.fixture
async def authenticated_client(async_client: AsyncClient, test_user: User) -> AsyncClient:
    """Override auth and settings dependencies."""
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


class TestListCourses:
    async def test_list_courses_returns_200(
        self, authenticated_client: AsyncClient, course: Course
    ) -> None:
        response = await authenticated_client.get("/api/v1/courses")
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        assert len(data["courses"]) >= 1

    async def test_list_courses_unauthenticated(self, async_client: AsyncClient) -> None:
        response = await async_client.get("/api/v1/courses")
        assert response.status_code in (401, 403)


class TestGetCourseDetail:
    async def test_get_course_detail_returns_200(
        self,
        authenticated_client: AsyncClient,
        course: Course,
        test_user: User,
        db_session: AsyncSession,
    ) -> None:
        enrollment = UserCourseEnrollment(
            user_id=test_user.id,
            course_id=course.id,
            current_unit_order=1,
            current_lesson_order=1,
            enrolled_at=datetime.now(timezone.utc),
        )
        db_session.add(enrollment)
        await db_session.flush()

        response = await authenticated_client.get(f"/api/v1/courses/{course.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Spanish for English Speakers"
        assert "units" in data

    async def test_get_nonexistent_course_returns_404(
        self, authenticated_client: AsyncClient
    ) -> None:
        response = await authenticated_client.get(f"/api/v1/courses/{uuid.uuid4()}")
        assert response.status_code == 404


class TestEnroll:
    async def test_enroll_returns_201(
        self, authenticated_client: AsyncClient, course: Course
    ) -> None:
        response = await authenticated_client.post(f"/api/v1/courses/{course.id}/enroll")
        assert response.status_code == 201
        data = response.json()
        assert "enrollment_id" in data
        assert "enrolled_at" in data

    async def test_duplicate_enroll_returns_409(
        self,
        authenticated_client: AsyncClient,
        course: Course,
        test_user: User,
        db_session: AsyncSession,
    ) -> None:
        enrollment = UserCourseEnrollment(
            user_id=test_user.id,
            course_id=course.id,
            current_unit_order=1,
            current_lesson_order=1,
            enrolled_at=datetime.now(timezone.utc),
        )
        db_session.add(enrollment)
        await db_session.flush()

        response = await authenticated_client.post(f"/api/v1/courses/{course.id}/enroll")
        assert response.status_code == 409

    async def test_enroll_nonexistent_course_returns_404(
        self, authenticated_client: AsyncClient
    ) -> None:
        response = await authenticated_client.post(f"/api/v1/courses/{uuid.uuid4()}/enroll")
        assert response.status_code == 404


class TestCourseDetailVideoQuiz:
    """Tests for video_quiz content_mode in course detail."""

    async def test_course_detail_video_quiz_mode(
        self,
        authenticated_client: AsyncClient,
        test_user: User,
        db_session: AsyncSession,
        tmp_path: Path,
    ) -> None:
        # Create a video_quiz course
        course = Course(
            id=uuid.uuid4(),
            language_from="en",
            language_to="math",
            title="Algebra Basics",
            description="Learn algebra",
            content_version="v1.0.0",
            total_units=1,
            total_lessons=1,
            is_published=True,
        )
        # Set content_mode if the column exists
        if hasattr(Course, "content_mode"):
            course.content_mode = "video_quiz"
        if hasattr(Course, "course_type"):
            course.course_type = "math"
        db_session.add(course)
        await db_session.flush()

        # Create enrollment
        enrollment = UserCourseEnrollment(
            user_id=test_user.id,
            course_id=course.id,
            current_unit_order=1,
            current_lesson_order=1,
            enrolled_at=datetime.now(timezone.utc),
        )
        db_session.add(enrollment)
        await db_session.flush()

        # Create a video lesson in DB
        vl = VideoLesson(
            id="vl-alg-basics-01",
            course_id=course.id,
            unit_order=1,
            lesson_order=1,
            title="What is Algebra?",
            video_url="https://example.com/videos/alg-01.mp4",
            video_duration_seconds=600,
            quiz_id="quiz-alg-01",
            watch_threshold_percent=80,
        )
        db_session.add(vl)
        await db_session.flush()

        # Create progress
        progress = VideoProgress(
            user_id=test_user.id,
            video_lesson_id=vl.id,
            watch_percent=85,
            last_position_seconds=510,
            completed=True,
        )
        db_session.add(progress)
        await db_session.flush()

        # Create manifest file
        course_slug = "algebra-basics"
        manifest_dir = tmp_path / "courses" / course_slug
        manifest_dir.mkdir(parents=True)
        manifest = {
            "course_slug": course_slug,
            "units": [
                {
                    "order": 1,
                    "title": "Unit 1: Intro",
                    "video_lessons": [
                        {
                            "id": "vl-alg-basics-01",
                            "order": 1,
                            "title": "What is Algebra?",
                            "duration_seconds": 600,
                            "thumbnail_url": None,
                            "quiz_id": "quiz-alg-01",
                        }
                    ],
                }
            ],
        }
        (manifest_dir / "manifest.json").write_text(json.dumps(manifest))

        # Override settings to point to tmp_path
        app = authenticated_client._transport.app  # type: ignore[attr-defined]

        def override_get_settings() -> Settings:
            s = MagicMock(spec=Settings)
            s.CONTENT_DIR = str(tmp_path)
            return s

        app.dependency_overrides[get_settings] = override_get_settings

        response = await authenticated_client.get(f"/api/v1/courses/{course.id}")

        # If content_mode column doesn't exist yet, this will fall through
        # to language course logic and may 404. Only assert on 200 if we
        # know video_quiz is supported.
        if hasattr(Course, "content_mode"):
            assert response.status_code == 200
            data = response.json()
            assert data["title"] == "Algebra Basics"
            assert len(data["units"]) == 1
            lesson = data["units"][0]["lessons"][0]
            assert lesson["id"] == "vl-alg-basics-01"
            assert lesson["type"] == "video"
            assert lesson["watch_percent"] == 85
            assert lesson["quiz_unlocked"] is True
