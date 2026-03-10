from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import Settings
from src.core.exceptions import NotFoundError
from src.courses.models import Course
from src.lessons.content_loader import ContentLoader
from src.lessons.schemas import ExerciseSubmitResponse, LessonOut
from src.lessons.validators import ValidatorResult, validate_answer
from src.progress.models import UserCourseEnrollment

XP_PER_CORRECT_ANSWER = 2


class LessonService:
    def __init__(
        self, db: AsyncSession, content_loader: ContentLoader, settings: Settings,
        base_url: str = "",
    ) -> None:
        self._db = db
        self._content_loader = content_loader
        self._settings = settings
        self._base_url = base_url.rstrip("/")

    async def get_lesson(self, lesson_id: str, course_id: uuid.UUID) -> LessonOut:
        """Get lesson metadata and content URL."""
        # Load course to get slug
        stmt = select(Course).where(Course.id == course_id)
        result = await self._db.execute(stmt)
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Course not found")

        course_slug = f"{course.language_to}-{course.language_from}"

        # Find lesson in manifest
        manifest = self._content_loader.load_manifest(course_slug)
        for unit in manifest.get("units", []):
            for lesson in unit.get("lessons", []):
                if lesson["id"] == lesson_id:
                    unit_order = unit["order"]
                    lesson_order = lesson["order"]
                    content_version = manifest.get("content_version", "v1.0.0")

                    content_url = (
                        f"{self._base_url}/content/courses/{course_slug}"
                        f"/units/{unit_order}/lessons/{lesson_order}.json"
                    )

                    return LessonOut(
                        id=lesson_id,
                        title=lesson["title"],
                        content_url=content_url,
                        exercise_count=lesson["exercise_count"],
                        estimated_minutes=lesson["estimated_minutes"],
                    )

        raise NotFoundError("Lesson not found")

    async def submit_answer(
        self,
        lesson_id: str,
        exercise_id: str,
        answer: str | list[str],
        user_id: uuid.UUID,
        course_id: uuid.UUID,
    ) -> ExerciseSubmitResponse:
        """Validate a submitted exercise answer."""
        # Load course to get slug
        stmt = select(Course).where(Course.id == course_id)
        result = await self._db.execute(stmt)
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Course not found")

        course_slug = f"{course.language_to}-{course.language_from}"

        # Find the lesson and exercise in content
        manifest = self._content_loader.load_manifest(course_slug)
        unit_order = None
        lesson_order = None
        for unit in manifest.get("units", []):
            for lesson in unit.get("lessons", []):
                if lesson["id"] == lesson_id:
                    unit_order = unit["order"]
                    lesson_order = lesson["order"]
                    break
            if unit_order is not None:
                break

        if unit_order is None or lesson_order is None:
            raise NotFoundError("Lesson not found")

        lesson_data = self._content_loader.load_lesson(course_slug, unit_order, lesson_order)

        # Find the exercise
        exercise_data = None
        for exercise in lesson_data.get("exercises", []):
            if exercise.get("id") == exercise_id:
                exercise_data = exercise
                break

        if exercise_data is None:
            raise NotFoundError("Exercise not found")

        # Validate the answer
        validator_result: ValidatorResult = validate_answer(
            exercise_data["type"], exercise_data, answer
        )

        xp_earned = XP_PER_CORRECT_ANSWER if validator_result.correct else 0

        return ExerciseSubmitResponse(
            correct=validator_result.correct,
            correct_answer=validator_result.correct_answer,
            explanation=validator_result.explanation,
            xp_earned=xp_earned,
        )
