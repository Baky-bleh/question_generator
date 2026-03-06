from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator

import fakeredis.aioredis
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.auth.models import User
from src.core.database import Base
from src.core.deps import get_db, get_redis

# Use SQLite for tests — no PostgreSQL dependency needed
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )
    # Import all models to populate metadata
    from src.auth.models import RefreshToken, User, UserAuthProvider  # noqa: F401
    from src.courses.models import Course  # noqa: F401
    from src.progress.models import (  # noqa: F401
        Achievement,
        LessonCompletion,
        UserCourseEnrollment,
        XPEvent,
    )
    from src.srs.models import SRSItem  # noqa: F401
    from src.streaks.models import Streak  # noqa: F401
    from src.subscriptions.models import Subscription  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession]:
    session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_redis():
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.flushall()
    await redis.aclose()


@pytest.fixture
async def async_client(db_session: AsyncSession, test_redis) -> AsyncGenerator[AsyncClient]:
    from src.main import create_app

    app = create_app()

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    async def override_get_redis():
        return test_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def create_test_user(db_session: AsyncSession):
    async def _create_test_user(
        email: str = "test@example.com",
        display_name: str = "Test User",
        password_hash: str | None = "$2b$12$LJ3m4ys3Lg2MqMx4f4Mxde4XOuYXfFxKOcFrR1DlXFnLeEJmniNHi",
    ) -> User:
        user = User(
            id=uuid.uuid4(),
            email=email,
            display_name=display_name,
            password_hash=password_hash,
        )
        db_session.add(user)
        await db_session.flush()
        return user

    return _create_test_user
