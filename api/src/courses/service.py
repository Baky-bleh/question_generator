from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import ConflictError, NotFoundError
from src.courses.models import Course
from src.courses.schemas import (
    CourseDetailResponse,
    CourseOut,
    EnrollmentOut,
    EnrollResponse,
    LessonSummaryOut,
    UnitOut,
)
from src.lessons.content_loader import ContentLoader
from src.progress.models import LessonCompletion, UserCourseEnrollment


class CourseService:
    def __init__(self, db: AsyncSession, content_loader: ContentLoader) -> None:
        self._db = db
        self._content_loader = content_loader

    async def list_courses(self) -> list[CourseOut]:
        """List all published courses."""
        stmt = select(Course).where(Course.is_published.is_(True))
        result = await self._db.execute(stmt)
        courses = result.scalars().all()
        return [CourseOut.model_validate(c) for c in courses]

    async def get_course_detail(
        self, course_id: uuid.UUID, user_id: uuid.UUID
    ) -> CourseDetailResponse:
        """Get course detail with units and user progress merged from manifest."""
        # Load course from DB
        stmt = select(Course).where(Course.id == course_id)
        result = await self._db.execute(stmt)
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Course not found")

        # Determine course slug from language pair
        course_slug = f"{course.language_to}-{course.language_from}"

        # Load manifest
        try:
            manifest = self._content_loader.load_manifest(course_slug)
        except FileNotFoundError:
            raise NotFoundError("Course content not found")

        # Load user enrollment
        enrollment_stmt = select(UserCourseEnrollment).where(
            UserCourseEnrollment.user_id == user_id,
            UserCourseEnrollment.course_id == course_id,
        )
        enrollment_result = await self._db.execute(enrollment_stmt)
        enrollment = enrollment_result.scalar_one_or_none()

        # Load user completions for this course
        completed_lessons: set[str] = set()
        best_scores: dict[str, int] = {}
        if enrollment:
            completions_stmt = select(LessonCompletion).where(
                LessonCompletion.user_id == user_id,
                LessonCompletion.course_id == course_id,
            )
            completions_result = await self._db.execute(completions_stmt)
            for comp in completions_result.scalars().all():
                completed_lessons.add(comp.lesson_id)
                existing_best = best_scores.get(comp.lesson_id, 0)
                if comp.score > existing_best:
                    best_scores[comp.lesson_id] = comp.score

        # Build units with lesson status
        units: list[UnitOut] = []
        total_lessons = 0
        prev_completed = True  # First lesson is always available

        for unit_data in manifest.get("units", []):
            lessons: list[LessonSummaryOut] = []
            for lesson_data in unit_data.get("lessons", []):
                total_lessons += 1
                lesson_id = lesson_data["id"]

                if lesson_id in completed_lessons:
                    status = "completed"
                elif prev_completed and enrollment is not None:
                    status = "available"
                elif total_lessons == 1 and enrollment is not None:
                    status = "available"
                else:
                    status = "locked"

                prev_completed = lesson_id in completed_lessons

                lessons.append(
                    LessonSummaryOut(
                        id=lesson_id,
                        order=lesson_data["order"],
                        title=lesson_data["title"],
                        type=lesson_data["type"],
                        status=status,
                        best_score=best_scores.get(lesson_id),
                        exercise_count=lesson_data["exercise_count"],
                    )
                )

            units.append(
                UnitOut(
                    order=unit_data["order"],
                    title=unit_data["title"],
                    lessons=lessons,
                )
            )

        # Build enrollment info
        enrollment_out = None
        if enrollment:
            completed_count = len(completed_lessons)
            total = sum(len(u.lessons) for u in units)
            overall_progress = completed_count / total if total > 0 else 0.0

            enrollment_out = EnrollmentOut(
                enrolled_at=enrollment.enrolled_at,
                current_unit=enrollment.current_unit_order,
                current_lesson=enrollment.current_lesson_order,
                overall_progress=round(overall_progress, 2),
            )

        return CourseDetailResponse(
            id=course.id,
            title=course.title,
            units=units,
            enrollment=enrollment_out,
        )

    async def enroll(self, course_id: uuid.UUID, user_id: uuid.UUID) -> EnrollResponse:
        """Enroll user in a course."""
        # Check course exists
        stmt = select(Course).where(Course.id == course_id)
        result = await self._db.execute(stmt)
        course = result.scalar_one_or_none()
        if course is None:
            raise NotFoundError("Course not found")

        # Check not already enrolled
        existing_stmt = select(UserCourseEnrollment).where(
            UserCourseEnrollment.user_id == user_id,
            UserCourseEnrollment.course_id == course_id,
        )
        existing_result = await self._db.execute(existing_stmt)
        if existing_result.scalar_one_or_none() is not None:
            raise ConflictError("Already enrolled in this course")

        now = datetime.now(timezone.utc)
        enrollment = UserCourseEnrollment(
            user_id=user_id,
            course_id=course_id,
            current_unit_order=1,
            current_lesson_order=1,
            enrolled_at=now,
        )
        self._db.add(enrollment)
        await self._db.flush()

        return EnrollResponse(
            enrollment_id=enrollment.id,
            enrolled_at=enrollment.enrolled_at,
        )
