from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.auth.schemas import (
    LoginRequest,
    LogoutRequest,
    OAuthRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    TokenResponse,
    UserProfileResponse,
    UserUpdateRequest,
)
from src.auth.service import AuthService
from src.core.config import Settings
from src.core.deps import get_db, get_redis, get_settings
from src.middleware.rate_limit import rate_limit_auth

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_auth)],
)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    service = AuthService(db, redis, settings)
    return await service.register(request.email, request.password, request.display_name)


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth)],
)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    service = AuthService(db, redis, settings)
    return await service.authenticate(request.email, request.password)


@router.post(
    "/refresh",
    response_model=RefreshResponse,
)
async def refresh(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> RefreshResponse:
    service = AuthService(db, redis, settings)
    return await service.refresh_token(request.refresh_token)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def logout(
    request: LogoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> Response:
    service = AuthService(db, redis, settings)
    await service.revoke_token(request.refresh_token, user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/oauth/{provider}",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth)],
)
async def oauth_login(
    provider: str,
    request: OAuthRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    service = AuthService(db, redis, settings)
    return await service.oauth_login(provider, request.id_token)


# --- User Profile Endpoints ---

users_router = APIRouter(prefix="/api/v1/users", tags=["users"])


@users_router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    user: User = Depends(get_current_user),
) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        timezone=user.timezone,
        daily_goal=user.daily_goal,
        role=user.role,
        created_at=user.created_at,
    )


@users_router.patch("/me", response_model=UserProfileResponse)
async def update_my_profile(
    request: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    update_data = request.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.flush()

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        timezone=user.timezone,
        daily_goal=user.daily_goal,
        role=user.role,
        created_at=user.created_at,
    )
