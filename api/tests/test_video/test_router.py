from __future__ import annotations

import json
import uuid
from pathlib import Path
from collections.abc import AsyncGenerator
from unittest.mock import MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.deps import get_db, get_redis
from src.video.models import VideoLesson, VideoProgress


@pytest.fixture
async def sample_course(db_session: AsyncSession) -> "Course":
    from src.courses.models import Course

    course = Course(
        id=uuid.uuid4(),
        language_from="en",
        language_to="math",
        title="Algebra Basics",
        description="Intro to algebra",
        content_version="1.0",
        total_units=1,
        total_lessons=2,
        is_published=True,
        course_type="math",
        content_mode="video_quiz",
    )
    db_session.add(course)
    await db_session.flush()
    return course


@pytest.fixture
async def sample_video_lesson(db_session: AsyncSession, sample_course: "Course") -> VideoLesson:
    vl = VideoLesson(
        id="vl-router-test-01",
        course_id=sample_course.id,
        unit_order=1,
        lesson_order=1,
        title="Router Test Video",
        description="A test video lesson",
        video_url="https://example.com/videos/test.mp4",
        video_duration_seconds=300,
        quiz_id="quiz-router-test-01",
        watch_threshold_percent=80,
    )
    db_session.add(vl)
    await db_session.flush()
    return vl


@pytest.fixture
async def test_user(db_session: AsyncSession, create_test_user) -> User:
    return await create_test_user(email="router-video-test@example.com")


@pytest.fixture
async def authed_client(
    db_session: AsyncSession, test_redis, test_user: User
) -> AsyncGenerator[AsyncClient]:
    from src.main import create_app

    app = create_app()

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    async def override_get_redis():
        return test_redis

    async def override_get_current_user() -> User:
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.anyio
async def test_get_video_lesson_endpoint(
    authed_client: AsyncClient, sample_video_lesson: VideoLesson
) -> None:
    resp = await authed_client.get(f"/api/v1/video-lessons/{sample_video_lesson.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["video_lesson"]["id"] == sample_video_lesson.id
    assert data["video_lesson"]["title"] == "Router Test Video"
    assert data["quiz_unlocked"] is False
    assert data["progress"] is None


@pytest.mark.anyio
async def test_update_progress_endpoint(
    authed_client: AsyncClient, sample_video_lesson: VideoLesson
) -> None:
    resp = await authed_client.post(
        f"/api/v1/video-lessons/{sample_video_lesson.id}/progress",
        json={"position_seconds": 150, "watch_percent": 50},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["watch_percent"] == 50
    assert data["last_position_seconds"] == 150
    assert data["completed"] is False
    assert data["quiz_unlocked"] is False


@pytest.mark.anyio
async def test_get_quiz_locked(
    authed_client: AsyncClient,
    db_session: AsyncSession,
    sample_video_lesson: VideoLesson,
    test_user: User,
) -> None:
    # Create progress below threshold
    progress = VideoProgress(
        user_id=test_user.id,
        video_lesson_id=sample_video_lesson.id,
        watch_percent=50,
        last_position_seconds=150,
        completed=False,
    )
    db_session.add(progress)
    await db_session.flush()

    resp = await authed_client.get(f"/api/v1/video-lessons/{sample_video_lesson.id}/quiz")
    assert resp.status_code == 403
    assert "80%" in resp.json()["detail"]


@pytest.mark.anyio
async def test_get_quiz_unlocked(
    authed_client: AsyncClient,
    db_session: AsyncSession,
    sample_video_lesson: VideoLesson,
    sample_course,
    test_user: User,
    tmp_path: Path,
) -> None:
    # Create progress at threshold
    progress = VideoProgress(
        user_id=test_user.id,
        video_lesson_id=sample_video_lesson.id,
        watch_percent=80,
        last_position_seconds=240,
        completed=True,
    )
    db_session.add(progress)
    await db_session.flush()

    # Create quiz file
    course_slug = sample_course.title.lower().replace(" ", "-")
    quiz_dir = tmp_path / "courses" / course_slug / "quizzes"
    quiz_dir.mkdir(parents=True)
    quiz_data = {"exercises": [{"type": "multiple_choice", "question": "Test?"}]}
    (quiz_dir / "quiz-router-test-01.json").write_text(json.dumps(quiz_data))

    # Override the content loader dependency to use tmp_path as content dir
    from src.lessons.content_loader import ContentLoader
    from src.video.router import _get_content_loader

    class TestContentLoader(ContentLoader):
        def __init__(self) -> None:
            self._content_dir = Path(str(tmp_path))

    def override_content_loader() -> ContentLoader:
        return TestContentLoader()

    authed_client._transport.app.dependency_overrides[_get_content_loader] = override_content_loader  # type: ignore[union-attr]

    resp = await authed_client.get(f"/api/v1/video-lessons/{sample_video_lesson.id}/quiz")
    assert resp.status_code == 200
    data = resp.json()
    assert data["exercises"][0]["type"] == "multiple_choice"
