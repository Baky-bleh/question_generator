from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.config import Settings
from src.core.deps import get_db, get_settings
from src.courses.schemas import CourseDetailResponse, CourseListResponse, EnrollResponse
from src.courses.service import CourseService
from src.lessons.content_loader import ContentLoader

router = APIRouter(prefix="/api/v1/courses", tags=["courses"])


def _get_content_loader(settings: Settings = Depends(get_settings)) -> ContentLoader:
    return ContentLoader(settings)


@router.get("", response_model=CourseListResponse)
async def list_courses(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
) -> CourseListResponse:
    service = CourseService(db, content_loader)
    courses = await service.list_courses()
    return CourseListResponse(courses=courses)


@router.get("/{course_id}", response_model=CourseDetailResponse)
async def get_course_detail(
    course_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
) -> CourseDetailResponse:
    service = CourseService(db, content_loader)
    return await service.get_course_detail(course_id, user.id)


@router.post("/{course_id}/enroll", response_model=EnrollResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
) -> EnrollResponse:
    service = CourseService(db, content_loader)
    return await service.enroll(course_id, user.id)
