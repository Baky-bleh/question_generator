from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User
from src.auth.security import hash_password


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=uuid.uuid4(),
        email="router@example.com",
        password_hash=hash_password("testpass123"),
        display_name="Router Test User",
    )
    db_session.add(user)
    await db_session.flush()
    return user


class TestRegisterEndpoint:
    async def test_register_201(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "new@example.com",
                "password": "strongpass123",
                "display_name": "New User",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@example.com"
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["expires_in"] == 900

    async def test_register_duplicate_409(self, async_client: AsyncClient) -> None:
        payload = {
            "email": "dup@example.com",
            "password": "strongpass123",
            "display_name": "User",
        }
        await async_client.post("/api/v1/auth/register", json=payload)
        resp = await async_client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 409

    async def test_register_short_password_422(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "short@example.com", "password": "short", "display_name": "User"},
        )
        assert resp.status_code == 422

    async def test_register_invalid_email_422(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={"email": "notanemail", "password": "strongpass123", "display_name": "User"},
        )
        assert resp.status_code == 422


class TestLoginEndpoint:
    async def test_login_200(self, async_client: AsyncClient, test_user: User) -> None:
        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "router@example.com", "password": "testpass123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "router@example.com"
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password_401(
        self, async_client: AsyncClient, test_user: User
    ) -> None:
        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "router@example.com", "password": "wrongpass"},
        )
        assert resp.status_code == 401

    async def test_login_nonexistent_401(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "ghost@example.com", "password": "anypass"},
        )
        assert resp.status_code == 401


class TestRefreshEndpoint:
    async def test_refresh_200(self, async_client: AsyncClient) -> None:
        # Register to get a refresh token
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "refresher@example.com",
                "password": "strongpass123",
                "display_name": "Refresher",
            },
        )
        refresh_token = reg.json()["refresh_token"]

        resp = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["expires_in"] == 900

    async def test_refresh_invalid_token_401(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )
        assert resp.status_code == 401

    async def test_refresh_reuse_revoked_401(self, async_client: AsyncClient) -> None:
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "reuse@example.com",
                "password": "strongpass123",
                "display_name": "Reuse",
            },
        )
        refresh_token = reg.json()["refresh_token"]

        # First use — succeeds and rotates
        resp1 = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp1.status_code == 200

        # Second use — should fail (token was revoked on rotation)
        resp2 = await async_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert resp2.status_code == 401


class TestLogoutEndpoint:
    async def test_logout_204(self, async_client: AsyncClient) -> None:
        # Register to get tokens
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "logout@example.com",
                "password": "strongpass123",
                "display_name": "Logout User",
            },
        )
        tokens = reg.json()

        resp = await async_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": tokens["refresh_token"]},
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        assert resp.status_code == 204

    async def test_logout_no_auth_401(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": "some-token"},
        )
        assert resp.status_code in (401, 403)


class TestOAuthEndpoint:
    async def test_oauth_unsupported_provider_401(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/oauth/facebook",
            json={"id_token": "some-token"},
        )
        assert resp.status_code == 401


class TestRegisterIncludesDisplayName:
    async def test_register_returns_display_name(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "dispname@example.com",
                "password": "strongpass123",
                "display_name": "My Name",
            },
        )
        assert resp.status_code == 201
        assert resp.json()["display_name"] == "My Name"

    async def test_login_returns_display_name(
        self, async_client: AsyncClient, test_user: User
    ) -> None:
        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "router@example.com", "password": "testpass123"},
        )
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Router Test User"


class TestGetProfile:
    async def test_get_profile_200(self, async_client: AsyncClient) -> None:
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "profile@example.com",
                "password": "strongpass123",
                "display_name": "Profile User",
            },
        )
        token = reg.json()["access_token"]

        resp = await async_client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "profile@example.com"
        assert data["display_name"] == "Profile User"
        assert data["timezone"] == "UTC"
        assert data["daily_goal"] == 10
        assert "created_at" in data

    async def test_get_profile_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.get("/api/v1/users/me")
        assert resp.status_code in (401, 403)


class TestUpdateProfile:
    async def test_update_display_name(self, async_client: AsyncClient) -> None:
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "update1@example.com",
                "password": "strongpass123",
                "display_name": "Original",
            },
        )
        token = reg.json()["access_token"]

        resp = await async_client.patch(
            "/api/v1/users/me",
            json={"display_name": "Updated"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Updated"

    async def test_update_daily_goal(self, async_client: AsyncClient) -> None:
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "update2@example.com",
                "password": "strongpass123",
                "display_name": "Goal User",
            },
        )
        token = reg.json()["access_token"]

        resp = await async_client.patch(
            "/api/v1/users/me",
            json={"daily_goal": 20},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["daily_goal"] == 20

    async def test_update_timezone(self, async_client: AsyncClient) -> None:
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "update3@example.com",
                "password": "strongpass123",
                "display_name": "TZ User",
            },
        )
        token = reg.json()["access_token"]

        resp = await async_client.patch(
            "/api/v1/users/me",
            json={"timezone": "America/New_York"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["timezone"] == "America/New_York"

    async def test_partial_update_preserves_other_fields(
        self, async_client: AsyncClient
    ) -> None:
        reg = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "partial@example.com",
                "password": "strongpass123",
                "display_name": "Partial User",
            },
        )
        token = reg.json()["access_token"]

        # Only update daily_goal
        resp = await async_client.patch(
            "/api/v1/users/me",
            json={"daily_goal": 15},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["display_name"] == "Partial User"
        assert data["timezone"] == "UTC"
        assert data["daily_goal"] == 15

    async def test_update_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.patch(
            "/api/v1/users/me",
            json={"display_name": "Hacker"},
        )
        assert resp.status_code in (401, 403)
