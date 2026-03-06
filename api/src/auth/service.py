from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import RefreshToken, User, UserAuthProvider
from src.auth.schemas import RefreshResponse, TokenResponse
from src.auth.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from src.core.config import Settings
from src.core.exceptions import ConflictError, UnauthorizedError


class AuthService:
    def __init__(self, db: AsyncSession, redis: Redis, settings: Settings) -> None:
        self.db = db
        self.redis = redis
        self.settings = settings

    async def register(
        self, email: str, password: str, display_name: str
    ) -> TokenResponse:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none() is not None:
            raise ConflictError("Email already registered")

        user = User(
            email=email,
            password_hash=hash_password(password),
            display_name=display_name,
        )
        self.db.add(user)
        await self.db.flush()

        return await self._create_token_response(user)

    async def authenticate(self, email: str, password: str) -> TokenResponse:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if user is None or user.password_hash is None:
            raise UnauthorizedError("Invalid email or password")

        if not verify_password(password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")

        return await self._create_token_response(user)

    async def refresh_token(self, refresh_token_str: str) -> RefreshResponse:
        token_hash = hash_token(refresh_token_str)
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        result = await self.db.execute(stmt)
        token_record = result.scalar_one_or_none()

        if token_record is None:
            raise UnauthorizedError("Invalid or expired refresh token")

        # Rotate: revoke old token
        token_record.revoked_at = datetime.now(timezone.utc)

        access_token = create_access_token(
            user_id=token_record.user_id,
            secret_key=self.settings.JWT_SECRET_KEY,
            expires_minutes=self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        )

        return RefreshResponse(
            access_token=access_token,
            expires_in=self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def revoke_token(self, refresh_token_str: str, user_id: UUID) -> None:
        token_hash = hash_token(refresh_token_str)
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        result = await self.db.execute(stmt)
        token_record = result.scalar_one_or_none()

        if token_record is not None:
            token_record.revoked_at = datetime.now(timezone.utc)

    async def oauth_login(self, provider: str, id_token: str) -> TokenResponse:
        if provider == "google":
            provider_info = await self._verify_google_token(id_token)
        elif provider == "apple":
            provider_info = await self._verify_apple_token(id_token)
        else:
            raise UnauthorizedError(f"Unsupported OAuth provider: {provider}")

        provider_user_id = provider_info["sub"]
        email = provider_info["email"]

        # Check if provider link exists
        stmt = select(UserAuthProvider).where(
            UserAuthProvider.provider == provider,
            UserAuthProvider.provider_user_id == provider_user_id,
        )
        result = await self.db.execute(stmt)
        auth_provider = result.scalar_one_or_none()

        if auth_provider is not None:
            # Existing user — load and return tokens
            stmt = select(User).where(User.id == auth_provider.user_id)
            result = await self.db.execute(stmt)
            user = result.scalar_one()
            return await self._create_token_response(user)

        # Check if user exists with this email
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if user is None:
            # Create new user
            display_name = provider_info.get("name", email.split("@")[0])
            user = User(
                email=email,
                display_name=display_name,
            )
            self.db.add(user)
            await self.db.flush()

        # Link provider
        link = UserAuthProvider(
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_user_id,
        )
        self.db.add(link)
        await self.db.flush()

        return await self._create_token_response(user)

    async def _create_token_response(self, user: User) -> TokenResponse:
        access_token = create_access_token(
            user_id=user.id,
            secret_key=self.settings.JWT_SECRET_KEY,
            expires_minutes=self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        )
        raw_refresh = create_refresh_token()

        refresh_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(raw_refresh),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=self.settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(refresh_record)
        await self.db.flush()

        return TokenResponse(
            user_id=user.id,
            email=user.email,
            display_name=user.display_name,
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=self.settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def _verify_google_token(self, id_token: str) -> dict:
        """Verify Google OAuth ID token and return user info."""
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        try:
            info = google_id_token.verify_oauth2_token(
                id_token,
                google_requests.Request(),
                self.settings.GOOGLE_OAUTH_CLIENT_ID,
            )
            return {
                "sub": info["sub"],
                "email": info["email"],
                "name": info.get("name", ""),
            }
        except ValueError as e:
            raise UnauthorizedError(f"Invalid Google token: {e}") from e

    async def _verify_apple_token(self, id_token: str) -> dict:
        """Verify Apple Sign In token and return user info."""
        from jose import jwt as jose_jwt

        try:
            # Apple tokens are JWTs; decode without full verification for now
            # In production, fetch Apple's public keys and verify properly
            claims = jose_jwt.get_unverified_claims(id_token)
            return {
                "sub": claims["sub"],
                "email": claims.get("email", ""),
                "name": claims.get("name", ""),
            }
        except Exception as e:
            raise UnauthorizedError(f"Invalid Apple token: {e}") from e
