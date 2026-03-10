from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import ForbiddenError, NotFoundError
from src.courses.models import Course
from src.lessons.content_loader import ContentLoader
from src.video.models import VideoLesson, VideoProgress
from src.video.schemas import (
    VideoLessonDetailResponse,
    VideoLessonOut,
    VideoProgressOut,
    VideoProgressResponse,
)


class VideoLessonService:
    def __init__(self, db: AsyncSession, content_loader: ContentLoader) -> None:
        self._db = db
        self._content_loader = content_loader

    async def get_video_lesson(
        self, video_lesson_id: str, user_id: uuid.UUID
    ) -> VideoLessonDetailResponse:
        """Get a video lesson with user progress and quiz unlock status."""
        video_lesson = await self._load_video_lesson(video_lesson_id)

        progress = await self._load_progress(video_lesson_id, user_id)

        quiz_unlocked = await self._check_quiz_unlocked(
            video_lesson_id, user_id, video_lesson.watch_threshold_percent
        )

        return VideoLessonDetailResponse(
            video_lesson=VideoLessonOut.model_validate(video_lesson),
            progress=VideoProgressOut.model_validate(progress) if progress else None,
            quiz_unlocked=quiz_unlocked,
        )

    async def update_progress(
        self,
        video_lesson_id: str,
        user_id: uuid.UUID,
        position_seconds: int,
        watch_percent: int,
    ) -> VideoProgressResponse:
        """Update watch progress for a video lesson."""
        video_lesson = await self._load_video_lesson(video_lesson_id)

        progress = await self._load_progress(video_lesson_id, user_id)

        now = datetime.now(timezone.utc)

        if progress is None:
            progress = VideoProgress(
                user_id=user_id,
                video_lesson_id=video_lesson_id,
                watch_percent=max(0, min(watch_percent, 100)),
                last_position_seconds=position_seconds,
                completed=False,
            )
            self._db.add(progress)
        else:
            # ANTI-CHEAT: never decrease watch_percent
            progress.watch_percent = max(progress.watch_percent, min(watch_percent, 100))
            # Position CAN go backwards (seeking)
            progress.last_position_seconds = position_seconds

        # Check completion
        threshold = video_lesson.watch_threshold_percent
        if progress.watch_percent >= threshold and not progress.completed:
            progress.completed = True
            progress.completed_at = now

        await self._db.flush()

        quiz_unlocked = progress.watch_percent >= threshold

        return VideoProgressResponse(
            watch_percent=progress.watch_percent,
            last_position_seconds=progress.last_position_seconds,
            completed=progress.completed,
            quiz_unlocked=quiz_unlocked,
        )

    async def get_quiz(self, video_lesson_id: str, user_id: uuid.UUID) -> dict:
        """Get quiz exercises for a video lesson, gated by watch progress."""
        video_lesson = await self._load_video_lesson(video_lesson_id)

        if not video_lesson.quiz_id:
            raise NotFoundError("This video lesson has no associated quiz")

        threshold = video_lesson.watch_threshold_percent
        progress = await self._load_progress(video_lesson_id, user_id)
        current_percent = progress.watch_percent if progress else 0

        if current_percent < threshold:
            raise ForbiddenError(
                f"Watch at least {threshold}% of the video to unlock the quiz"
            )

        # Load quiz JSON from content directory
        course_slug = await self._get_course_slug(video_lesson.course_id)
        content_dir = Path(self._content_loader._content_dir)
        quiz_path = content_dir / "courses" / course_slug / "quizzes" / f"{video_lesson.quiz_id}.json"

        if not quiz_path.exists():
            raise NotFoundError("Quiz content not found")

        with open(quiz_path) as f:
            return json.load(f)

    async def _check_quiz_unlocked(
        self, video_lesson_id: str, user_id: uuid.UUID, threshold: int
    ) -> bool:
        """Check if user's watch_percent meets the threshold."""
        progress = await self._load_progress(video_lesson_id, user_id)
        if progress is None:
            return False
        return progress.watch_percent >= threshold

    async def _load_video_lesson(self, video_lesson_id: str) -> VideoLesson:
        """Load a video lesson or raise NotFoundError."""
        stmt = select(VideoLesson).where(VideoLesson.id == video_lesson_id)
        result = await self._db.execute(stmt)
        video_lesson = result.scalar_one_or_none()
        if video_lesson is None:
            raise NotFoundError("Video lesson not found")
        return video_lesson

    async def _load_progress(
        self, video_lesson_id: str, user_id: uuid.UUID
    ) -> VideoProgress | None:
        """Load user's progress for a video lesson."""
        stmt = select(VideoProgress).where(
            VideoProgress.user_id == user_id,
            VideoProgress.video_lesson_id == video_lesson_id,
        )
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()

    async def _get_course_slug(self, course_id: uuid.UUID) -> str:
        """Determine the course slug from the course record."""
        stmt = select(Course).where(Course.id == course_id)
        result = await self._db.execute(stmt)
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Course not found")

        # For video_quiz courses, use a slug based on course title
        if hasattr(course, "content_mode") and course.content_mode == "video_quiz":
            return course.title.lower().replace(" ", "-")
        # For language courses, use language pair
        return f"{course.language_to}-{course.language_from}"
