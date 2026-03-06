from __future__ import annotations

from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.auth.security import decode_access_token
from src.core.config import Settings
from src.core.deps import get_db, get_settings
from src.core.exceptions import UnauthorizedError

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
    app_settings: Settings = Depends(get_settings),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token, app_settings.JWT_SECRET_KEY)
    except JWTError:
        raise UnauthorizedError("Invalid or expired token")

    user_id = UUID(payload["sub"])
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise UnauthorizedError("User not found")

    return user
