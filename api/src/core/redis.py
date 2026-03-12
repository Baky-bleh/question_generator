from __future__ import annotations

import logging
from typing import Any

from src.core.config import settings

logger = logging.getLogger(__name__)


class _NoOpRedis:
    """In-memory stub used when Redis is not available.

    Implements only the methods the codebase actually uses so the app
    runs without a real Redis instance (streaks fall back to DB,
    rate limiting is effectively disabled).
    """

    async def hgetall(self, name: str) -> dict:  # noqa: ARG002
        return {}

    async def hset(self, name: str, mapping: dict[str, Any] | None = None, **kw: Any) -> int:  # noqa: ARG002
        return 0

    async def incr(self, name: str) -> int:  # noqa: ARG002
        return 1

    async def expire(self, name: str, time: int) -> bool:  # noqa: ARG002
        return True


def _build_client() -> Any:
    if not settings.REDIS_URL:
        logger.info("REDIS_URL is empty — running without Redis")
        return _NoOpRedis()

    try:
        from redis.asyncio import from_url

        client = from_url(settings.REDIS_URL, decode_responses=True)
        logger.info("Redis client created for %s", settings.REDIS_URL)
        return client
    except Exception:
        logger.warning("Could not create Redis client — falling back to no-op stub", exc_info=True)
        return _NoOpRedis()


redis_client = _build_client()


async def get_redis() -> Any:
    return redis_client
