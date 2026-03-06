from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.deps import get_db, get_redis
from src.progress.schemas import (
    CourseProgressResponse,
    LessonCompleteRequest,
    LessonCompleteResponse,
    ProgressSummaryResponse,
)
from src.progress.service import ProgressService

router = APIRouter(prefix="/api/v1", tags=["progress"])


@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
    lesson_id: str,
    request: LessonCompleteRequest,
    course_id: UUID = Query(..., description="Course ID for context"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> LessonCompleteResponse:
    service = ProgressService(db, redis)
    return await service.complete_lesson(
        user_id=user.id,
        lesson_id=lesson_id,
        course_id=course_id,
        request=request,
        user_timezone=user.timezone,
    )


@router.get("/progress/me", response_model=ProgressSummaryResponse)
async def get_my_progress(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> ProgressSummaryResponse:
    service = ProgressService(db, redis)
    return await service.get_progress_summary(user.id)


@router.get("/progress/me/course/{course_id}", response_model=CourseProgressResponse)
async def get_my_course_progress(
    course_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> CourseProgressResponse:
    service = ProgressService(db, redis)
    return await service.get_course_progress(user.id, course_id)
