from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.deps import get_db
from src.srs.schemas import ReviewNextResponse, ReviewSubmitRequest, ReviewSubmitResponse
from src.srs.service import SRSService

router = APIRouter(prefix="/api/v1/review", tags=["review"])


@router.get("/next", response_model=ReviewNextResponse)
async def get_next_review_items(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    course_id: UUID | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
) -> ReviewNextResponse:
    base_url = str(request.base_url).rstrip("/")
    service = SRSService(db, base_url=base_url)
    return await service.get_due_items(
        user_id=user.id,
        course_id=course_id,
        limit=limit,
    )


@router.post("/submit", response_model=ReviewSubmitResponse)
async def submit_review(
    request: ReviewSubmitRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewSubmitResponse:
    service = SRSService(db)
    return await service.submit_review(
        user_id=user.id,
        concept_id=request.concept_id,
        quality=request.quality,
    )
