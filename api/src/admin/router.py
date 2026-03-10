from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user, require_admin, require_teacher
from src.auth.models import User
from src.core.deps import get_db
from src.video.storage import VideoStorage, get_video_storage

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
    VideoUploadResponse,
)
from src.admin.service import AdminService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def _get_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(db)


# --- User management (admin only) ---


@router.get("/users", response_model=UserListResponse)
async def list_users(
    role: str | None = Query(None, pattern="^(student|teacher|admin)$"),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    _admin: User = Depends(require_admin),
    service: AdminService = Depends(_get_service),
) -> UserListResponse:
    """List users. Admin only."""
    return await service.list_users(role=role, offset=offset, limit=limit)


@router.patch("/users/{user_id}/role", response_model=UserSummaryOut)
async def update_user_role(
    user_id: uuid.UUID,
    request: UserRoleUpdateRequest,
    _admin: User = Depends(require_admin),
    service: AdminService = Depends(_get_service),
) -> UserSummaryOut:
    """Update a user's role. Admin only."""
    return await service.update_user_role(user_id, request)


# --- Course management (teacher+) ---


@router.post("/courses", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
async def create_course(
    request: CourseCreateRequest,
    _teacher: User = Depends(require_teacher),
    service: AdminService = Depends(_get_service),
) -> CourseOut:
    """Create a new course. Teacher or admin."""
    return await service.create_course(request)


# --- Video lesson management (teacher+) ---


@router.get("/video-lessons", response_model=VideoLessonListResponse)
async def list_video_lessons(
    course_id: uuid.UUID | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    _teacher: User = Depends(require_teacher),
    service: AdminService = Depends(_get_service),
) -> VideoLessonListResponse:
    """List video lessons. Teacher or admin."""
    return await service.list_video_lessons(course_id=course_id, offset=offset, limit=limit)


@router.post(
    "/video-lessons",
    response_model=VideoLessonOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_video_lesson(
    request: VideoLessonCreateRequest,
    _teacher: User = Depends(require_teacher),
    service: AdminService = Depends(_get_service),
) -> VideoLessonOut:
    """Create a new video lesson. Teacher or admin."""
    return await service.create_video_lesson(request)


@router.patch("/video-lessons/{video_lesson_id}", response_model=VideoLessonOut)
async def update_video_lesson(
    video_lesson_id: str,
    request: VideoLessonUpdateRequest,
    _teacher: User = Depends(require_teacher),
    service: AdminService = Depends(_get_service),
) -> VideoLessonOut:
    """Update a video lesson. Teacher or admin."""
    return await service.update_video_lesson(video_lesson_id, request)


@router.delete(
    "/video-lessons/{video_lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_video_lesson(
    video_lesson_id: str,
    _teacher: User = Depends(require_teacher),
    service: AdminService = Depends(_get_service),
) -> Response:
    """Delete a video lesson. Teacher or admin."""
    await service.delete_video_lesson(video_lesson_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- File upload (teacher+) ---

ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB


def _get_storage() -> VideoStorage:
    return get_video_storage()


@router.post(
    "/upload/video",
    response_model=VideoUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_video(
    file: UploadFile,
    _teacher: User = Depends(require_teacher),
    storage: VideoStorage = Depends(_get_storage),
) -> VideoUploadResponse:
    """Upload a video file. Teacher or admin. Returns the playback URL."""
    from src.core.exceptions import ValidationError

    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise ValidationError(
            f"Invalid video type '{file.content_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_VIDEO_TYPES))}"
        )

    data = await file.read()
    if len(data) > MAX_VIDEO_SIZE:
        raise ValidationError(
            f"Video file too large ({len(data)} bytes). Max: {MAX_VIDEO_SIZE} bytes."
        )

    # Sanitize filename: keep extension, use original name
    filename = file.filename or "upload.mp4"
    storage.store_video(filename, data)
    url = storage.get_playback_url(filename)

    return VideoUploadResponse(filename=filename, url=url, size_bytes=len(data))


@router.post(
    "/upload/thumbnail",
    response_model=VideoUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_thumbnail(
    file: UploadFile,
    _teacher: User = Depends(require_teacher),
    storage: VideoStorage = Depends(_get_storage),
) -> VideoUploadResponse:
    """Upload a thumbnail image. Teacher or admin. Returns the URL."""
    from src.core.exceptions import ValidationError

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise ValidationError(
            f"Invalid image type '{file.content_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_IMAGE_TYPES))}"
        )

    data = await file.read()
    if len(data) > MAX_IMAGE_SIZE:
        raise ValidationError(
            f"Image file too large ({len(data)} bytes). Max: {MAX_IMAGE_SIZE} bytes."
        )

    filename = file.filename or "thumbnail.jpg"
    storage.store_video(filename, data)
    url = storage.get_playback_url(filename)

    return VideoUploadResponse(filename=filename, url=url, size_bytes=len(data))
