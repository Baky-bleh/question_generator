from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.core.exceptions import ConflictError, NotFoundError
from src.courses.models import Course
from src.video.models import VideoLesson

from src.admin.schemas import (
    CourseCreateRequest,
    CourseOut,
    UserListResponse,
    UserRoleUpdateRequest,
    UserSummaryOut,
    VideoLessonCreateRequest,
    VideoLessonListResponse,
    VideoLessonOut,
    VideoLessonUpdateRequest,
)


class AdminService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # --- User management ---

    async def list_users(
        self, role: str | None = None, offset: int = 0, limit: int = 50
    ) -> UserListResponse:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)

        if role:
            stmt = stmt.where(User.role == role)
            count_stmt = count_stmt.where(User.role == role)

        stmt = stmt.order_by(User.created_at.desc()).offset(offset).limit(limit)

        result = await self._db.execute(stmt)
        users = result.scalars().all()

        count_result = await self._db.execute(count_stmt)
        total = count_result.scalar() or 0

        return UserListResponse(
            users=[UserSummaryOut.model_validate(u) for u in users],
            total=total,
        )

    async def update_user_role(
        self, user_id: uuid.UUID, request: UserRoleUpdateRequest
    ) -> UserSummaryOut:
        stmt = select(User).where(User.id == user_id)
        result = await self._db.execute(stmt)
        user = result.scalar_one_or_none()

        if user is None:
            raise NotFoundError("User not found")

        user.role = request.role
        await self._db.flush()

        return UserSummaryOut.model_validate(user)

    # --- Course management ---

    async def create_course(self, request: CourseCreateRequest) -> CourseOut:
        course = Course(
            language_from=request.language_from,
            language_to=request.language_to,
            title=request.title,
            description=request.description,
            course_type=request.course_type,
            content_mode=request.content_mode,
            total_units=request.total_units,
            total_lessons=request.total_lessons,
            content_version=request.content_version,
            is_published=request.is_published,
        )
        self._db.add(course)
        try:
            await self._db.flush()
        except IntegrityError:
            raise ConflictError(
                f"Course with language pair '{request.language_from}' → '{request.language_to}' already exists"
            )
        return CourseOut.model_validate(course)

    # --- Video lesson management ---

    async def list_video_lessons(
        self, course_id: uuid.UUID | None = None, offset: int = 0, limit: int = 50
    ) -> VideoLessonListResponse:
        stmt = select(VideoLesson)
        count_stmt = select(func.count()).select_from(VideoLesson)

        if course_id:
            stmt = stmt.where(VideoLesson.course_id == course_id)
            count_stmt = count_stmt.where(VideoLesson.course_id == course_id)

        stmt = (
            stmt.order_by(VideoLesson.unit_order, VideoLesson.lesson_order)
            .offset(offset)
            .limit(limit)
        )

        result = await self._db.execute(stmt)
        lessons = result.scalars().all()

        count_result = await self._db.execute(count_stmt)
        total = count_result.scalar() or 0

        return VideoLessonListResponse(
            video_lessons=[VideoLessonOut.model_validate(vl) for vl in lessons],
            total=total,
        )

    async def create_video_lesson(self, request: VideoLessonCreateRequest) -> VideoLessonOut:
        # Check course exists
        course_stmt = select(Course).where(Course.id == request.course_id)
        course_result = await self._db.execute(course_stmt)
        if course_result.scalar_one_or_none() is None:
            raise NotFoundError("Course not found")

        # Check ID uniqueness
        existing_stmt = select(VideoLesson).where(VideoLesson.id == request.id)
        existing_result = await self._db.execute(existing_stmt)
        if existing_result.scalar_one_or_none() is not None:
            raise ConflictError(f"Video lesson with id '{request.id}' already exists")

        vl = VideoLesson(
            id=request.id,
            course_id=request.course_id,
            unit_order=request.unit_order,
            lesson_order=request.lesson_order,
            title=request.title,
            description=request.description,
            video_url=request.video_url,
            video_duration_seconds=request.video_duration_seconds,
            thumbnail_url=request.thumbnail_url,
            teacher_name=request.teacher_name,
            quiz_id=request.quiz_id,
            watch_threshold_percent=request.watch_threshold_percent,
        )
        self._db.add(vl)
        await self._db.flush()

        return VideoLessonOut.model_validate(vl)

    async def update_video_lesson(
        self, video_lesson_id: str, request: VideoLessonUpdateRequest
    ) -> VideoLessonOut:
        stmt = select(VideoLesson).where(VideoLesson.id == video_lesson_id)
        result = await self._db.execute(stmt)
        vl = result.scalar_one_or_none()

        if vl is None:
            raise NotFoundError("Video lesson not found")

        update_data = request.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(vl, field, value)

        await self._db.flush()
        return VideoLessonOut.model_validate(vl)

    async def delete_video_lesson(self, video_lesson_id: str) -> None:
        stmt = select(VideoLesson).where(VideoLesson.id == video_lesson_id)
        result = await self._db.execute(stmt)
        vl = result.scalar_one_or_none()

        if vl is None:
            raise NotFoundError("Video lesson not found")

        await self._db.delete(vl)
        await self._db.flush()
