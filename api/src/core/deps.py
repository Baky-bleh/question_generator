from __future__ import annotations

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import Settings, settings
from src.core.database import async_session_factory
from src.core.redis import redis_client


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_redis() -> Redis:
    return redis_client


def get_settings() -> Settings:
    return settings


async def get_current_user() -> None:
    raise NotImplementedError(
        "get_current_user is a placeholder. Auth agent replaces this with real implementation."
    )


async def get_user_features() -> dict[str, bool]:
    """Stub returning trial defaults. Full implementation in Phase 4."""
    return {
        "show_ads": False,
        "has_premium": True,
        "streak_freeze": True,
    }


DbSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[Redis, Depends(get_redis)]
CurrentSettings = Annotated[Settings, Depends(get_settings)]
UserFeatures = Annotated[dict[str, bool], Depends(get_user_features)]
