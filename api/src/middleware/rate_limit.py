from __future__ import annotations

from fastapi import Depends, Request, status
from redis.asyncio import Redis

from src.core.exceptions import AppException
from src.core.deps import get_redis

RATE_LIMIT_AUTH_MAX = 10
RATE_LIMIT_AUTH_WINDOW = 900  # 15 minutes in seconds


class RateLimitExceeded(AppException):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    detail = "Too many requests. Please try again later."


async def rate_limit_auth(
    request: Request,
    redis: Redis = Depends(get_redis),
) -> None:
    """Rate limit auth endpoints to 10 requests per 15 minutes per IP."""
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:auth:{client_ip}"

    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, RATE_LIMIT_AUTH_WINDOW)

    if current > RATE_LIMIT_AUTH_MAX:
        raise RateLimitExceeded()
