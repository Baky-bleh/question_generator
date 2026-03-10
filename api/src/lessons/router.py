from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.config import Settings
from src.core.deps import get_db, get_settings
from src.lessons.content_loader import ContentLoader
from src.lessons.schemas import ExerciseSubmitRequest, ExerciseSubmitResponse, LessonOut
from src.lessons.service import LessonService

router = APIRouter(prefix="/api/v1/lessons", tags=["lessons"])


def _get_content_loader(settings: Settings = Depends(get_settings)) -> ContentLoader:
    return ContentLoader(settings)


@router.get("/{lesson_id}", response_model=LessonOut)
async def get_lesson(
    lesson_id: str,
    request: Request,
    course_id: uuid.UUID = Query(..., description="Course ID for context"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
    settings: Settings = Depends(get_settings),
) -> LessonOut:
    base_url = str(request.base_url).rstrip("/")
    service = LessonService(db, content_loader, settings, base_url=base_url)
    return await service.get_lesson(lesson_id, course_id)


@router.post("/{lesson_id}/submit", response_model=ExerciseSubmitResponse)
async def submit_exercise(
    lesson_id: str,
    request: ExerciseSubmitRequest,
    course_id: uuid.UUID = Query(..., description="Course ID for context"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
    settings: Settings = Depends(get_settings),
) -> ExerciseSubmitResponse:
    service = LessonService(db, content_loader, settings)
    return await service.submit_answer(
        lesson_id, request.exercise_id, request.answer, user.id, course_id
    )
