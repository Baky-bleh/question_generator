from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from src.courses.models import Course
from src.srs.models import SRSItem
from src.srs.service import SRSService


@pytest.fixture
async def srs_service(db_session):
    return SRSService(db_session)


@pytest.fixture
async def user_with_srs_items(db_session, create_test_user):
    user = await create_test_user(email="srs_svc@test.com")
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

    now = datetime.now(timezone.utc)

    # Due item
    due_item = SRSItem(
        user_id=user.id,
        course_id=course.id,
        concept_id="vocab-hola",
        concept_type="vocabulary",
        ease_factor=2.5,
        interval_days=1,
        repetition_count=0,
        next_review_at=now - timedelta(hours=1),
    )
    # Future item (not due)
    future_item = SRSItem(
        user_id=user.id,
        course_id=course.id,
        concept_id="vocab-adios",
        concept_type="vocabulary",
        ease_factor=2.5,
        interval_days=1,
        repetition_count=0,
        next_review_at=now + timedelta(days=3),
    )
    db_session.add_all([due_item, future_item])
    await db_session.flush()
    return user, course, due_item, future_item


class TestGetDueItems:
    @pytest.mark.asyncio
    async def test_returns_only_due_items(
        self, srs_service, user_with_srs_items
    ) -> None:
        user, course, _, _ = user_with_srs_items
        result = await srs_service.get_due_items(user.id)
        assert result.total_due == 1
        assert len(result.items) == 1
        assert result.items[0].concept_id == "vocab-hola"

    @pytest.mark.asyncio
    async def test_filters_by_course(
        self, srs_service, user_with_srs_items
    ) -> None:
        user, course, _, _ = user_with_srs_items
        result = await srs_service.get_due_items(user.id, course_id=course.id)
        assert result.total_due == 1

    @pytest.mark.asyncio
    async def test_respects_limit(
        self, srs_service, user_with_srs_items
    ) -> None:
        user, _, _, _ = user_with_srs_items
        result = await srs_service.get_due_items(user.id, limit=0)
        assert len(result.items) == 0

    @pytest.mark.asyncio
    async def test_empty_when_no_due_items(
        self, srs_service, create_test_user
    ) -> None:
        user = await create_test_user(email="nodue@test.com")
        result = await srs_service.get_due_items(user.id)
        assert result.total_due == 0
        assert len(result.items) == 0


class TestSubmitReview:
    @pytest.mark.asyncio
    async def test_updates_srs_state(
        self, srs_service, user_with_srs_items
    ) -> None:
        user, _, due_item, _ = user_with_srs_items
        result = await srs_service.submit_review(user.id, "vocab-hola", quality=5)
        assert result.new_interval_days >= 1
        assert result.new_ease_factor > 0
        assert result.next_review_at > datetime.now(timezone.utc)

    @pytest.mark.asyncio
    async def test_failed_review_resets_interval(
        self, srs_service, user_with_srs_items
    ) -> None:
        user, _, _, _ = user_with_srs_items
        result = await srs_service.submit_review(user.id, "vocab-hola", quality=1)
        assert result.new_interval_days == 1

    @pytest.mark.asyncio
    async def test_nonexistent_concept_raises(
        self, srs_service, user_with_srs_items
    ) -> None:
        user, _, _, _ = user_with_srs_items
        from src.core.exceptions import NotFoundError
        with pytest.raises(NotFoundError):
            await srs_service.submit_review(user.id, "nonexistent", quality=3)
