from __future__ import annotations

import uuid

import fakeredis.aioredis
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import RefreshToken, User
from src.auth.security import hash_password, hash_token, verify_password
from src.auth.service import AuthService
from src.core.config import Settings
from src.core.exceptions import ConflictError, UnauthorizedError


@pytest.fixture
def settings() -> Settings:
    return Settings(
        JWT_SECRET_KEY="test-secret",
        JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15,
        JWT_REFRESH_TOKEN_EXPIRE_DAYS=30,
        DATABASE_URL="sqlite+aiosqlite:///./test.db",
    )


@pytest.fixture
def redis():
    return fakeredis.aioredis.FakeRedis(decode_responses=True)


@pytest.fixture
def auth_service(db_session: AsyncSession, redis, settings: Settings) -> AuthService:
    return AuthService(db_session, redis, settings)


class TestRegister:
    async def test_register_success(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        result = await auth_service.register("new@example.com", "password123", "New User")
        assert result.email == "new@example.com"
        assert result.access_token
        assert result.refresh_token
        assert result.expires_in == 900

        # Verify user in DB
        stmt = select(User).where(User.email == "new@example.com")
        res = await db_session.execute(stmt)
        user = res.scalar_one()
        assert user.display_name == "New User"
        assert verify_password("password123", user.password_hash)

    async def test_register_duplicate_email(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        user = User(
            id=uuid.uuid4(),
            email="dupe@example.com",
            password_hash=hash_password("pass123"),
            display_name="Existing",
        )
        db_session.add(user)
        await db_session.flush()

        with pytest.raises(ConflictError, match="Email already registered"):
            await auth_service.register("dupe@example.com", "password123", "Another")


class TestAuthenticate:
    async def test_authenticate_success(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        user = User(
            id=uuid.uuid4(),
            email="login@example.com",
            password_hash=hash_password("correctpass"),
            display_name="Login User",
        )
        db_session.add(user)
        await db_session.flush()

        result = await auth_service.authenticate("login@example.com", "correctpass")
        assert result.email == "login@example.com"
        assert result.access_token
        assert result.refresh_token

    async def test_authenticate_wrong_password(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        user = User(
            id=uuid.uuid4(),
            email="wrong@example.com",
            password_hash=hash_password("correctpass"),
            display_name="User",
        )
        db_session.add(user)
        await db_session.flush()

        with pytest.raises(UnauthorizedError, match="Invalid email or password"):
            await auth_service.authenticate("wrong@example.com", "badpass")

    async def test_authenticate_nonexistent_email(self, auth_service: AuthService) -> None:
        with pytest.raises(UnauthorizedError, match="Invalid email or password"):
            await auth_service.authenticate("nobody@example.com", "pass")

    async def test_authenticate_oauth_only_user(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        user = User(
            id=uuid.uuid4(),
            email="oauth@example.com",
            password_hash=None,
            display_name="OAuth User",
        )
        db_session.add(user)
        await db_session.flush()

        with pytest.raises(UnauthorizedError, match="Invalid email or password"):
            await auth_service.authenticate("oauth@example.com", "anypass")


class TestRefreshToken:
    async def test_refresh_success(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        # Register to get a valid refresh token
        reg = await auth_service.register("refresh@example.com", "password123", "Refresh User")
        result = await auth_service.refresh_token(reg.refresh_token)
        assert result.access_token
        assert result.expires_in == 900

        # Old token should be revoked
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(reg.refresh_token)
        )
        res = await db_session.execute(stmt)
        old_token = res.scalar_one()
        assert old_token.revoked_at is not None

    async def test_refresh_invalid_token(self, auth_service: AuthService) -> None:
        with pytest.raises(UnauthorizedError, match="Invalid or expired refresh token"):
            await auth_service.refresh_token("totally-invalid-token")

    async def test_refresh_revoked_token(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        reg = await auth_service.register("revoked@example.com", "password123", "Revoked User")
        # Use once — rotates (revokes old)
        await auth_service.refresh_token(reg.refresh_token)
        # Use again — should fail because it's revoked
        with pytest.raises(UnauthorizedError, match="Invalid or expired refresh token"):
            await auth_service.refresh_token(reg.refresh_token)


class TestRevokeToken:
    async def test_revoke_success(
        self, auth_service: AuthService, db_session: AsyncSession
    ) -> None:
        reg = await auth_service.register("logout@example.com", "password123", "Logout User")
        await auth_service.revoke_token(reg.refresh_token, reg.user_id)

        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == hash_token(reg.refresh_token)
        )
        res = await db_session.execute(stmt)
        token_record = res.scalar_one()
        assert token_record.revoked_at is not None

    async def test_revoke_nonexistent_token(self, auth_service: AuthService) -> None:
        # Should not raise — just silently does nothing
        await auth_service.revoke_token("nonexistent", uuid.uuid4())
