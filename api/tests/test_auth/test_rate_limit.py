from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestRateLimit:
    async def test_rate_limit_allows_under_threshold(self, async_client: AsyncClient) -> None:
        for i in range(3):
            resp = await async_client.post(
                "/api/v1/auth/login",
                json={"email": f"user{i}@example.com", "password": "pass"},
            )
            # Should get 401 (bad credentials), NOT 429
            assert resp.status_code == 401

    async def test_rate_limit_blocks_over_threshold(self, async_client: AsyncClient) -> None:
        # Make 11 requests (limit is 10)
        for i in range(10):
            await async_client.post(
                "/api/v1/auth/login",
                json={"email": "ratelimit@example.com", "password": "pass"},
            )

        resp = await async_client.post(
            "/api/v1/auth/login",
            json={"email": "ratelimit@example.com", "password": "pass"},
        )
        assert resp.status_code == 429

    async def test_rate_limit_applies_to_register(self, async_client: AsyncClient) -> None:
        for i in range(10):
            await async_client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"flood{i}@example.com",
                    "password": "strongpass123",
                    "display_name": "Flood",
                },
            )

        resp = await async_client.post(
            "/api/v1/auth/register",
            json={
                "email": "flood11@example.com",
                "password": "strongpass123",
                "display_name": "Flood",
            },
        )
        assert resp.status_code == 429
