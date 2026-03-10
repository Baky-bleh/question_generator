from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.config import Settings
from src.core.deps import get_db, get_settings
from src.lessons.content_loader import ContentLoader
from src.video.schemas import (
    VideoLessonDetailResponse,
    VideoProgressResponse,
    VideoProgressUpdateRequest,
)
from src.video.service import VideoLessonService

router = APIRouter(prefix="/api/v1/video-lessons", tags=["video-lessons"])


def _get_content_loader(settings: Settings = Depends(get_settings)) -> ContentLoader:
    return ContentLoader(settings)


@router.get("/{video_lesson_id}", response_model=VideoLessonDetailResponse)
async def get_video_lesson(
    video_lesson_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
) -> VideoLessonDetailResponse:
    """Get a video lesson with user progress and quiz unlock status."""
    service = VideoLessonService(db, content_loader)
    return await service.get_video_lesson(video_lesson_id, user.id)


@router.post("/{video_lesson_id}/progress", response_model=VideoProgressResponse)
async def update_progress(
    video_lesson_id: str,
    body: VideoProgressUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
) -> VideoProgressResponse:
    """Update watch progress for a video lesson."""
    service = VideoLessonService(db, content_loader)
    return await service.update_progress(
        video_lesson_id, user.id, body.position_seconds, body.watch_percent
    )


@router.get("/{video_lesson_id}/quiz")
async def get_quiz(
    video_lesson_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    content_loader: ContentLoader = Depends(_get_content_loader),
) -> dict:
    """Get quiz exercises for a video lesson (gated by watch progress)."""
    service = VideoLessonService(db, content_loader)
    return await service.get_quiz(video_lesson_id, user.id)
