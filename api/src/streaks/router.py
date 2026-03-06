from __future__ import annotations

from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.deps import get_db, get_redis
from src.streaks.schemas import StreakResponse
from src.streaks.service import StreakService

router = APIRouter(prefix="/api/v1/streaks", tags=["streaks"])


@router.get("/me", response_model=StreakResponse)
async def get_my_streak(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> StreakResponse:
    service = StreakService(db, redis)
    return await service.get_streak(user.id)
