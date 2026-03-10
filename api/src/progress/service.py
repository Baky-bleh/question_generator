from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.courses.models import Course
from src.progress.models import LessonCompletion, UserCourseEnrollment, XPEvent
from src.progress.schemas import (
    CourseProgressResponse,
    CourseProgressSummary,
    LessonCompleteRequest,
    LessonCompleteResponse,
    NextLesson,
    ProgressSummaryResponse,
    StreakInfo,
    TodayStats,
)
from src.progress.xp import calculate_xp
from src.streaks.service import StreakService


class ProgressService:
    def __init__(self, db: AsyncSession, redis: Redis) -> None:
        self._db = db
        self._redis = redis
        self._streak_service = StreakService(db, redis)

    async def complete_lesson(
        self,
        user_id: uuid.UUID,
        lesson_id: str,
        course_id: uuid.UUID,
        request: LessonCompleteRequest,
        user_timezone: str,
    ) -> LessonCompleteResponse:
        """Mark a lesson as completed. Creates LessonCompletion + XPEvent,
        updates streak, enrollment position, and returns XP breakdown."""
        # Get current streak count for XP calculation
        streak_info = await self._streak_service.get_streak(user_id)

        # Calculate XP
        xp = calculate_xp(
            score=request.score,
            time_seconds=request.time_seconds,
            streak_count=streak_info.current,
        )

        # Find enrollment for this course
        enrollment = await self._find_enrollment(user_id, course_id)

        # Parse unit_order and lesson_order from lesson_id (format: "unit-X-lesson-Y" or similar)
        unit_order, lesson_order = self._parse_lesson_position(lesson_id)

        # Create lesson completion record
        completion = LessonCompletion(
            user_id=user_id,
            course_id=course_id,
            lesson_id=lesson_id,
            unit_order=unit_order,
            lesson_order=lesson_order,
            score=request.score,
            xp_earned=xp.total,
            time_seconds=request.time_seconds,
            mistakes=request.mistakes,
            is_perfect=request.perfect,
            completed_at=datetime.now(timezone.utc),
        )
        self._db.add(completion)

        # Create XP event
        xp_event = XPEvent(
            user_id=user_id,
            source="lesson",
            amount=xp.total,
            metadata_={"lesson_id": lesson_id},
            created_at=datetime.now(timezone.utc),
        )
        self._db.add(xp_event)

        # Update enrollment position if this lesson advances the user
        if enrollment is not None:
            if unit_order > enrollment.current_unit_order or (
                unit_order == enrollment.current_unit_order
                and lesson_order >= enrollment.current_lesson_order
            ):
                enrollment.current_unit_order = unit_order
                enrollment.current_lesson_order = lesson_order + 1

        # Check in for streak
        streak_response = await self._streak_service.check_in(user_id, user_timezone)

        await self._db.flush()

        # Resolve next_lesson via ContentLoader (if available)
        next_lesson = await self._resolve_next_lesson(course_id, unit_order, lesson_order)

        return LessonCompleteResponse(
            xp_earned=xp.total,
            xp_breakdown=xp,
            streak=StreakInfo(
                current=streak_response.current,
                is_new_record=streak_response.current == streak_response.longest
                and streak_response.current > 1,
            ),
            achievements_unlocked=[],
            next_lesson=next_lesson,
        )

    async def get_progress_summary(self, user_id: uuid.UUID) -> ProgressSummaryResponse:
        """Get overall progress summary for a user."""
        # Total XP
        total_xp_result = await self._db.execute(
            select(func.coalesce(func.sum(XPEvent.amount), 0)).where(XPEvent.user_id == user_id)
        )
        total_xp = total_xp_result.scalar() or 0

        # Level: 1 level per 100 XP
        level = (total_xp // 100) + 1

        # Course progress summaries
        enrollments_result = await self._db.execute(
            select(UserCourseEnrollment, Course)
            .join(Course, UserCourseEnrollment.course_id == Course.id)
            .where(UserCourseEnrollment.user_id == user_id)
        )
        course_summaries: list[CourseProgressSummary] = []
        for enrollment, course in enrollments_result.all():
            # Count completed lessons for this course
            completed_count_result = await self._db.execute(
                select(func.count(func.distinct(LessonCompletion.lesson_id))).where(
                    LessonCompletion.user_id == user_id,
                    LessonCompletion.course_id == course.id,
                )
            )
            completed_count = completed_count_result.scalar() or 0
            total_lessons = course.total_lessons or 1
            progress = completed_count / total_lessons

            streak_info = await self._streak_service.get_streak(user_id)

            course_summaries.append(
                CourseProgressSummary(
                    course_id=course.id,
                    title=course.title,
                    progress=round(progress, 2),
                    current_streak=streak_info.current,
                )
            )

        # Today stats
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_lessons_result = await self._db.execute(
            select(func.count())
            .select_from(LessonCompletion)
            .where(
                LessonCompletion.user_id == user_id,
                LessonCompletion.completed_at >= today_start,
            )
        )
        today_lessons = today_lessons_result.scalar() or 0

        today_xp_result = await self._db.execute(
            select(func.coalesce(func.sum(XPEvent.amount), 0)).where(
                XPEvent.user_id == user_id,
                XPEvent.created_at >= today_start,
            )
        )
        today_xp = today_xp_result.scalar() or 0

        return ProgressSummaryResponse(
            total_xp=total_xp,
            level=level,
            courses=course_summaries,
            today=TodayStats(
                lessons_completed=today_lessons,
                xp_earned=today_xp,
                goal_met=today_lessons >= 1,
            ),
        )

    async def get_course_progress(
        self, user_id: uuid.UUID, course_id: uuid.UUID
    ) -> CourseProgressResponse:
        """Get detailed progress for a specific course."""
        # Get course
        course_result = await self._db.execute(select(Course).where(Course.id == course_id))
        course = course_result.scalar_one_or_none()
        if course is None:
            from src.core.exceptions import NotFoundError

            raise NotFoundError("Course not found")

        # Completed lessons count (distinct lesson_ids)
        completed_result = await self._db.execute(
            select(func.count(func.distinct(LessonCompletion.lesson_id))).where(
                LessonCompletion.user_id == user_id,
                LessonCompletion.course_id == course_id,
            )
        )
        lessons_completed = completed_result.scalar() or 0

        # Total XP in this course
        xp_result = await self._db.execute(
            select(func.coalesce(func.sum(LessonCompletion.xp_earned), 0)).where(
                LessonCompletion.user_id == user_id,
                LessonCompletion.course_id == course_id,
            )
        )
        total_xp_in_course = xp_result.scalar() or 0

        # Time spent
        time_result = await self._db.execute(
            select(func.coalesce(func.sum(LessonCompletion.time_seconds), 0)).where(
                LessonCompletion.user_id == user_id,
                LessonCompletion.course_id == course_id,
            )
        )
        total_time_seconds = time_result.scalar() or 0

        # Units completed: count distinct unit_orders where all lessons in that unit are done
        # Simplified: count distinct completed unit_orders
        units_completed_result = await self._db.execute(
            select(func.count(func.distinct(LessonCompletion.unit_order))).where(
                LessonCompletion.user_id == user_id,
                LessonCompletion.course_id == course_id,
            )
        )
        units_completed = units_completed_result.scalar() or 0

        return CourseProgressResponse(
            course_id=course_id,
            units_completed=units_completed,
            units_total=course.total_units,
            lessons_completed=lessons_completed,
            lessons_total=course.total_lessons,
            total_xp_in_course=total_xp_in_course,
            words_learned=0,
            time_spent_minutes=total_time_seconds // 60,
        )

    async def _find_enrollment(
        self, user_id: uuid.UUID, course_id: uuid.UUID
    ) -> UserCourseEnrollment | None:
        """Find enrollment for a specific course."""
        result = await self._db.execute(
            select(UserCourseEnrollment).where(
                UserCourseEnrollment.user_id == user_id,
                UserCourseEnrollment.course_id == course_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _parse_lesson_position(lesson_id: str) -> tuple[int, int]:
        """Parse unit_order and lesson_order from lesson_id.
        Expected format examples: 'u1-l3' or similar encoded IDs.
        Falls back to (1, 1) if format is not recognized."""
        try:
            # Try common formats
            if "-" in lesson_id:
                parts = lesson_id.split("-")
                for i, part in enumerate(parts):
                    if part.startswith("u") and i + 1 < len(parts):
                        unit = int(part[1:])
                        next_part = parts[i + 1]
                        if next_part.startswith("l"):
                            lesson = int(next_part[1:])
                            return unit, lesson
        except (ValueError, IndexError):
            pass
        return 1, 1

    async def _resolve_next_lesson(
        self,
        course_id: uuid.UUID | None,
        unit_order: int,
        lesson_order: int,
    ) -> NextLesson | None:
        """Resolve the next lesson using ContentLoader if available."""
        if course_id is None:
            return None

        try:
            from src.lessons.content_loader import ContentLoader
            from src.core.config import settings

            loader = ContentLoader(settings)

            # Get course slug from DB
            course_result = await self._db.execute(select(Course).where(Course.id == course_id))
            course = course_result.scalar_one_or_none()
            if course is None:
                return None

            course_slug = f"{course.language_to}-{course.language_from}"
            manifest = loader.load_manifest(course_slug)

            # Find next lesson in manifest
            for unit in manifest.get("units", []):
                if unit.get("order") == unit_order:
                    for lesson in unit.get("lessons", []):
                        if lesson.get("order") == lesson_order + 1:
                            return NextLesson(
                                id=lesson.get("id", ""),
                                title=lesson.get("title", ""),
                            )
                    # If no next lesson in this unit, try first lesson of next unit
                    break

            # Check next unit
            for unit in manifest.get("units", []):
                if unit.get("order") == unit_order + 1:
                    lessons = unit.get("lessons", [])
                    if lessons:
                        first = lessons[0]
                        return NextLesson(
                            id=first.get("id", ""),
                            title=first.get("title", ""),
                        )
                    break

        except (ImportError, FileNotFoundError, KeyError):
            pass

        return None
