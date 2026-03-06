from __future__ import annotations

import pytest

from src.auth.deps import get_current_user


@pytest.fixture
async def auth_client(async_client, create_test_user, db_session):
    user = await create_test_user(email="streak_router@test.com")

    async def override_user():
        return user

    async_client._transport.app.dependency_overrides[get_current_user] = override_user
    yield async_client, user
    async_client._transport.app.dependency_overrides.pop(get_current_user, None)


class TestStreakRouter:
    @pytest.mark.asyncio
    async def test_get_streak_returns_200(self, auth_client) -> None:
        client, user = auth_client
        response = await client.get("/api/v1/streaks/me")
        assert response.status_code == 200
        data = response.json()
        assert "current" in data
        assert "longest" in data
        assert "today_completed" in data
        assert "freeze_available" in data
        assert "freeze_remaining" in data

    @pytest.mark.asyncio
    async def test_get_streak_unauthenticated(self, async_client) -> None:
        response = await async_client.get("/api/v1/streaks/me")
        assert response.status_code in (401, 403)
