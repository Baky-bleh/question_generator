from __future__ import annotations

import json
import uuid
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import ForbiddenError, NotFoundError
from src.video.models import VideoLesson, VideoProgress
from src.video.service import VideoLessonService


@pytest.fixture
def content_loader() -> MagicMock:
    loader = MagicMock()
    loader._content_dir = Path("/tmp/test_content")
    return loader


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
        id="vl-algebra-01",
        course_id=sample_course.id,
        unit_order=1,
        lesson_order=1,
        title="What is Algebra?",
        description="Introduction to algebraic concepts",
        video_url="https://example.com/videos/algebra-01.mp4",
        video_duration_seconds=600,
        thumbnail_url="https://example.com/thumbs/algebra-01.jpg",
        teacher_name="Prof. Smith",
        quiz_id="quiz-algebra-01",
        watch_threshold_percent=80,
    )
    db_session.add(vl)
    await db_session.flush()
    return vl


@pytest.fixture
async def sample_user(db_session: AsyncSession, create_test_user) -> "User":
    return await create_test_user(email="video-test@example.com")


@pytest.mark.anyio
async def test_get_video_lesson_not_found(
    db_session: AsyncSession, sample_user, content_loader: MagicMock
) -> None:
    service = VideoLessonService(db_session, content_loader)
    with pytest.raises(NotFoundError, match="Video lesson not found"):
        await service.get_video_lesson("nonexistent-id", sample_user.id)


@pytest.mark.anyio
async def test_get_video_lesson_with_progress(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    # Create progress
    progress = VideoProgress(
        user_id=sample_user.id,
        video_lesson_id=sample_video_lesson.id,
        watch_percent=45,
        last_position_seconds=270,
        completed=False,
    )
    db_session.add(progress)
    await db_session.flush()

    service = VideoLessonService(db_session, content_loader)
    result = await service.get_video_lesson(sample_video_lesson.id, sample_user.id)

    assert result.video_lesson.id == sample_video_lesson.id
    assert result.video_lesson.title == "What is Algebra?"
    assert result.progress is not None
    assert result.progress.watch_percent == 45
    assert result.progress.last_position_seconds == 270
    assert result.quiz_unlocked is False


@pytest.mark.anyio
async def test_update_progress_creates_new(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    service = VideoLessonService(db_session, content_loader)
    result = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=120, watch_percent=20
    )

    assert result.watch_percent == 20
    assert result.last_position_seconds == 120
    assert result.completed is False
    assert result.quiz_unlocked is False


@pytest.mark.anyio
async def test_update_progress_never_decreases(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    # Create initial progress at 60%
    progress = VideoProgress(
        user_id=sample_user.id,
        video_lesson_id=sample_video_lesson.id,
        watch_percent=60,
        last_position_seconds=360,
        completed=False,
    )
    db_session.add(progress)
    await db_session.flush()

    service = VideoLessonService(db_session, content_loader)

    # Try to decrease to 30% — should stay at 60%
    result = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=180, watch_percent=30
    )

    assert result.watch_percent == 60  # Never decreases
    assert result.last_position_seconds == 180  # Position CAN go backwards


@pytest.mark.anyio
async def test_quiz_locked_at_79_percent(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    progress = VideoProgress(
        user_id=sample_user.id,
        video_lesson_id=sample_video_lesson.id,
        watch_percent=79,
        last_position_seconds=474,
        completed=False,
    )
    db_session.add(progress)
    await db_session.flush()

    service = VideoLessonService(db_session, content_loader)
    with pytest.raises(ForbiddenError, match="Watch at least 80% of the video"):
        await service.get_quiz(sample_video_lesson.id, sample_user.id)


@pytest.mark.anyio
async def test_quiz_unlocked_at_80_percent(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    sample_course,
    content_loader: MagicMock,
    tmp_path: Path,
) -> None:
    progress = VideoProgress(
        user_id=sample_user.id,
        video_lesson_id=sample_video_lesson.id,
        watch_percent=80,
        last_position_seconds=480,
        completed=True,
    )
    db_session.add(progress)
    await db_session.flush()

    # Set up quiz file on disk
    course_slug = sample_course.title.lower().replace(" ", "-")
    quiz_dir = tmp_path / "courses" / course_slug / "quizzes"
    quiz_dir.mkdir(parents=True)
    quiz_data = {"exercises": [{"type": "multiple_choice", "question": "What is x?"}]}
    (quiz_dir / "quiz-algebra-01.json").write_text(json.dumps(quiz_data))

    # Point content_loader to tmp_path
    content_loader._content_dir = tmp_path

    service = VideoLessonService(db_session, content_loader)
    result = await service.get_quiz(sample_video_lesson.id, sample_user.id)

    assert result["exercises"][0]["type"] == "multiple_choice"


@pytest.mark.anyio
async def test_quiz_returns_exercises(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    sample_course,
    content_loader: MagicMock,
    tmp_path: Path,
) -> None:
    # Set progress to 100%
    progress = VideoProgress(
        user_id=sample_user.id,
        video_lesson_id=sample_video_lesson.id,
        watch_percent=100,
        last_position_seconds=600,
        completed=True,
    )
    db_session.add(progress)
    await db_session.flush()

    course_slug = sample_course.title.lower().replace(" ", "-")
    quiz_dir = tmp_path / "courses" / course_slug / "quizzes"
    quiz_dir.mkdir(parents=True)
    quiz_data = {
        "exercises": [
            {"type": "multiple_choice", "question": "Solve for x: 2x + 3 = 7"},
            {"type": "fill_blank", "question": "x = ___"},
        ]
    }
    (quiz_dir / "quiz-algebra-01.json").write_text(json.dumps(quiz_data))

    content_loader._content_dir = tmp_path

    service = VideoLessonService(db_session, content_loader)
    result = await service.get_quiz(sample_video_lesson.id, sample_user.id)

    assert len(result["exercises"]) == 2
    assert result["exercises"][0]["type"] == "multiple_choice"
    assert result["exercises"][1]["type"] == "fill_blank"


@pytest.mark.anyio
async def test_quiz_no_progress_returns_forbidden(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    """User with no progress at all should be forbidden from quiz."""
    service = VideoLessonService(db_session, content_loader)
    with pytest.raises(ForbiddenError, match="Watch at least 80%"):
        await service.get_quiz(sample_video_lesson.id, sample_user.id)


@pytest.mark.anyio
async def test_progress_never_decreases_multiple_updates(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    """Sending multiple decreasing watch_percent values should keep the max."""
    service = VideoLessonService(db_session, content_loader)

    # First update: 50%
    r1 = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=300, watch_percent=50
    )
    assert r1.watch_percent == 50

    # Second update: 70%
    r2 = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=420, watch_percent=70
    )
    assert r2.watch_percent == 70

    # Third update: try to go back to 40%
    r3 = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=240, watch_percent=40
    )
    assert r3.watch_percent == 70  # Should not decrease

    # Fourth update: go to 90%
    r4 = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=540, watch_percent=90
    )
    assert r4.watch_percent == 90
    assert r4.quiz_unlocked is True


@pytest.mark.anyio
async def test_progress_caps_at_100(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    """Watch percent above 100 should be capped at 100."""
    service = VideoLessonService(db_session, content_loader)
    result = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=600, watch_percent=150
    )
    assert result.watch_percent == 100


@pytest.mark.anyio
async def test_update_progress_nonexistent_video(
    db_session: AsyncSession,
    sample_user,
    content_loader: MagicMock,
) -> None:
    """Updating progress for a nonexistent video lesson should 404."""
    service = VideoLessonService(db_session, content_loader)
    with pytest.raises(NotFoundError, match="Video lesson not found"):
        await service.update_progress(
            "nonexistent-vl", sample_user.id, position_seconds=100, watch_percent=20
        )


@pytest.mark.anyio
async def test_quiz_no_quiz_id_returns_not_found(
    db_session: AsyncSession,
    sample_user,
    sample_course,
    content_loader: MagicMock,
) -> None:
    """Video lesson with no quiz_id should return NotFoundError."""
    vl_no_quiz = VideoLesson(
        id="vl-no-quiz",
        course_id=sample_course.id,
        unit_order=1,
        lesson_order=2,
        title="No Quiz Lesson",
        video_url="https://example.com/videos/noquiz.mp4",
        video_duration_seconds=300,
        quiz_id=None,
        watch_threshold_percent=80,
    )
    db_session.add(vl_no_quiz)
    await db_session.flush()

    # Add progress above threshold
    progress = VideoProgress(
        user_id=sample_user.id,
        video_lesson_id="vl-no-quiz",
        watch_percent=100,
        last_position_seconds=300,
        completed=True,
    )
    db_session.add(progress)
    await db_session.flush()

    service = VideoLessonService(db_session, content_loader)
    with pytest.raises(NotFoundError, match="no associated quiz"):
        await service.get_quiz("vl-no-quiz", sample_user.id)


@pytest.mark.anyio
async def test_completion_flag_set_on_reaching_threshold(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    """When watch_percent reaches the threshold, completed should become True."""
    service = VideoLessonService(db_session, content_loader)

    # First update: below threshold
    r1 = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=200, watch_percent=50
    )
    assert r1.completed is False

    # Second update: at threshold (80%)
    r2 = await service.update_progress(
        sample_video_lesson.id, sample_user.id, position_seconds=480, watch_percent=80
    )
    assert r2.completed is True
    assert r2.quiz_unlocked is True


@pytest.mark.anyio
async def test_get_video_lesson_no_progress(
    db_session: AsyncSession,
    sample_user,
    sample_video_lesson: VideoLesson,
    content_loader: MagicMock,
) -> None:
    """Getting a video lesson with no progress should return progress=None, quiz_unlocked=False."""
    service = VideoLessonService(db_session, content_loader)
    result = await service.get_video_lesson(sample_video_lesson.id, sample_user.id)

    assert result.progress is None
    assert result.quiz_unlocked is False
    assert result.video_lesson.title == "What is Algebra?"
