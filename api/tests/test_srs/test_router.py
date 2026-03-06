from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from src.auth.deps import get_current_user
from src.srs.models import SRSItem


@pytest.fixture
async def auth_client_with_srs(async_client, create_test_user, db_session):
    user = await create_test_user(email="srs_router@test.com")

    # Create a course for the SRS item
    from src.courses.models import Course
    course = Course(
        id=uuid.uuid4(),
        language_from="en",
        language_to="es",
        title="Spanish",
        content_version="v1.0.0",
        total_units=2,
        total_lessons=10,
        is_published=True,
    )
    db_session.add(course)
    await db_session.flush()

    # Create due SRS item
    srs_item = SRSItem(
        user_id=user.id,
        course_id=course.id,
        concept_id="vocab-hello",
        concept_type="vocabulary",
        ease_factor=2.5,
        interval_days=1,
        repetition_count=0,
        next_review_at=datetime.now(timezone.utc),
    )
    db_session.add(srs_item)
    await db_session.flush()

    async def override_user():
        return user

    async_client._transport.app.dependency_overrides[get_current_user] = override_user
    yield async_client, user, course, srs_item
    async_client._transport.app.dependency_overrides.pop(get_current_user, None)


class TestReviewNextRouter:
    @pytest.mark.asyncio
    async def test_get_next_returns_due_items(self, auth_client_with_srs) -> None:
        client, user, course, _ = auth_client_with_srs
        response = await client.get("/api/v1/review/next")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total_due" in data
        assert data["total_due"] >= 1
        assert data["items"][0]["concept_id"] == "vocab-hello"

    @pytest.mark.asyncio
    async def test_get_next_with_course_filter(self, auth_client_with_srs) -> None:
        client, _, course, _ = auth_client_with_srs
        response = await client.get(f"/api/v1/review/next?course_id={course.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["total_due"] >= 1


class TestReviewSubmitRouter:
    @pytest.mark.asyncio
    async def test_submit_review_updates_srs(self, auth_client_with_srs) -> None:
        client, _, _, _ = auth_client_with_srs
        response = await client.post(
            "/api/v1/review/submit",
            json={"concept_id": "vocab-hello", "quality": 4},
        )
        assert response.status_code == 200
        data = response.json()
        assert "new_interval_days" in data
        assert "new_ease_factor" in data
        assert "next_review_at" in data

    @pytest.mark.asyncio
    async def test_submit_review_invalid_concept(self, auth_client_with_srs) -> None:
        client, _, _, _ = auth_client_with_srs
        response = await client.post(
            "/api/v1/review/submit",
            json={"concept_id": "nonexistent", "quality": 3},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_submit_review_invalid_quality(self, auth_client_with_srs) -> None:
        client, _, _, _ = auth_client_with_srs
        response = await client.post(
            "/api/v1/review/submit",
            json={"concept_id": "vocab-hello", "quality": 6},
        )
        assert response.status_code == 422
