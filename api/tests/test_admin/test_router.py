from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.deps import get_current_user
from src.auth.models import User
from src.core.deps import get_db, get_redis
from src.courses.models import Course


@pytest.fixture
async def admin_user(db_session: AsyncSession, create_test_user) -> User:
    user = await create_test_user(email="admin@example.com")
    user.role = "admin"
    await db_session.flush()
    return user


@pytest.fixture
async def teacher_user(db_session: AsyncSession, create_test_user) -> User:
    user = await create_test_user(email="teacher@example.com")
    user.role = "teacher"
    await db_session.flush()
    return user


@pytest.fixture
async def student_user(db_session: AsyncSession, create_test_user) -> User:
    return await create_test_user(email="student@example.com")


def _make_client(db_session: AsyncSession, test_redis, user: User) -> AsyncGenerator[AsyncClient]:
    from src.main import create_app

    app = create_app()

    async def override_get_db() -> AsyncGenerator[AsyncSession]:
        yield db_session

    async def override_get_redis():
        return test_redis

    async def override_get_current_user() -> User:
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis
    app.dependency_overrides[get_current_user] = override_get_current_user

    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
async def admin_client(
    db_session: AsyncSession, test_redis, admin_user: User
) -> AsyncGenerator[AsyncClient]:
    async with _make_client(db_session, test_redis, admin_user) as client:
        yield client


@pytest.fixture
async def teacher_client(
    db_session: AsyncSession, test_redis, teacher_user: User
) -> AsyncGenerator[AsyncClient]:
    async with _make_client(db_session, test_redis, teacher_user) as client:
        yield client


@pytest.fixture
async def student_client(
    db_session: AsyncSession, test_redis, student_user: User
) -> AsyncGenerator[AsyncClient]:
    async with _make_client(db_session, test_redis, student_user) as client:
        yield client


@pytest.fixture
async def math_course(db_session: AsyncSession) -> Course:
    course = Course(
        language_from="en",
        language_to="math",
        title="Algebra Basics",
        course_type="math",
        content_mode="video_quiz",
        total_units=1,
        total_lessons=2,
        content_version="1.0",
        is_published=True,
    )
    db_session.add(course)
    await db_session.flush()
    return course


# --- Role-based access tests ---


class TestRoleAccess:
    @pytest.mark.anyio
    async def test_student_cannot_access_admin_users(self, student_client: AsyncClient) -> None:
        resp = await student_client.get("/api/v1/admin/users")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_teacher_cannot_access_admin_users(self, teacher_client: AsyncClient) -> None:
        resp = await teacher_client.get("/api/v1/admin/users")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_admin_can_list_users(self, admin_client: AsyncClient) -> None:
        resp = await admin_client.get("/api/v1/admin/users")
        assert resp.status_code == 200
        data = resp.json()
        assert "users" in data
        assert "total" in data

    @pytest.mark.anyio
    async def test_student_cannot_create_video_lesson(
        self, student_client: AsyncClient, math_course: Course
    ) -> None:
        resp = await student_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-test",
                "course_id": str(math_course.id),
                "unit_order": 1,
                "lesson_order": 1,
                "title": "Test",
                "video_url": "http://example.com/v.mp4",
                "video_duration_seconds": 300,
            },
        )
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_teacher_can_create_video_lesson(
        self, teacher_client: AsyncClient, math_course: Course
    ) -> None:
        resp = await teacher_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-teacher-test",
                "course_id": str(math_course.id),
                "unit_order": 1,
                "lesson_order": 1,
                "title": "Teacher Lesson",
                "video_url": "http://example.com/v.mp4",
                "video_duration_seconds": 300,
            },
        )
        assert resp.status_code == 201
        assert resp.json()["title"] == "Teacher Lesson"


# --- User management tests ---


class TestUserManagement:
    @pytest.mark.anyio
    async def test_update_user_role(self, admin_client: AsyncClient, student_user: User) -> None:
        resp = await admin_client.patch(
            f"/api/v1/admin/users/{student_user.id}/role",
            json={"role": "teacher"},
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "teacher"

    @pytest.mark.anyio
    async def test_update_role_invalid_value(
        self, admin_client: AsyncClient, student_user: User
    ) -> None:
        resp = await admin_client.patch(
            f"/api/v1/admin/users/{student_user.id}/role",
            json={"role": "superuser"},
        )
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_update_role_nonexistent_user(self, admin_client: AsyncClient) -> None:
        fake_id = str(uuid.uuid4())
        resp = await admin_client.patch(
            f"/api/v1/admin/users/{fake_id}/role",
            json={"role": "teacher"},
        )
        assert resp.status_code == 404

    @pytest.mark.anyio
    async def test_list_users_filter_by_role(self, admin_client: AsyncClient) -> None:
        resp = await admin_client.get("/api/v1/admin/users?role=admin")
        assert resp.status_code == 200
        data = resp.json()
        for user in data["users"]:
            assert user["role"] == "admin"


# --- Video lesson management tests ---


class TestVideoLessonManagement:
    @pytest.mark.anyio
    async def test_create_video_lesson(
        self, admin_client: AsyncClient, math_course: Course
    ) -> None:
        resp = await admin_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-admin-01",
                "course_id": str(math_course.id),
                "unit_order": 1,
                "lesson_order": 1,
                "title": "Intro to Variables",
                "description": "Learn about variables",
                "video_url": "http://localhost:8000/static/videos/intro.mp4",
                "video_duration_seconds": 600,
                "teacher_name": "Prof. Smith",
                "quiz_id": "quiz-01",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["id"] == "vl-admin-01"
        assert data["title"] == "Intro to Variables"
        assert data["teacher_name"] == "Prof. Smith"
        assert data["watch_threshold_percent"] == 80

    @pytest.mark.anyio
    async def test_create_duplicate_id_fails(
        self, admin_client: AsyncClient, math_course: Course
    ) -> None:
        body = {
            "id": "vl-dup",
            "course_id": str(math_course.id),
            "unit_order": 1,
            "lesson_order": 1,
            "title": "First",
            "video_url": "http://example.com/v.mp4",
            "video_duration_seconds": 300,
        }
        resp1 = await admin_client.post("/api/v1/admin/video-lessons", json=body)
        assert resp1.status_code == 201

        resp2 = await admin_client.post("/api/v1/admin/video-lessons", json=body)
        assert resp2.status_code == 409

    @pytest.mark.anyio
    async def test_list_video_lessons(self, admin_client: AsyncClient, math_course: Course) -> None:
        # Create a lesson first
        await admin_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-list-01",
                "course_id": str(math_course.id),
                "unit_order": 1,
                "lesson_order": 1,
                "title": "List Test",
                "video_url": "http://example.com/v.mp4",
                "video_duration_seconds": 300,
            },
        )
        resp = await admin_client.get("/api/v1/admin/video-lessons")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert len(data["video_lessons"]) >= 1

    @pytest.mark.anyio
    async def test_update_video_lesson(
        self, admin_client: AsyncClient, math_course: Course
    ) -> None:
        await admin_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-update-01",
                "course_id": str(math_course.id),
                "unit_order": 1,
                "lesson_order": 1,
                "title": "Original Title",
                "video_url": "http://example.com/v.mp4",
                "video_duration_seconds": 300,
            },
        )
        resp = await admin_client.patch(
            "/api/v1/admin/video-lessons/vl-update-01",
            json={"title": "Updated Title", "teacher_name": "Dr. Jones"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"
        assert resp.json()["teacher_name"] == "Dr. Jones"

    @pytest.mark.anyio
    async def test_delete_video_lesson(
        self, admin_client: AsyncClient, math_course: Course
    ) -> None:
        await admin_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-delete-01",
                "course_id": str(math_course.id),
                "unit_order": 1,
                "lesson_order": 1,
                "title": "To Delete",
                "video_url": "http://example.com/v.mp4",
                "video_duration_seconds": 300,
            },
        )
        resp = await admin_client.delete("/api/v1/admin/video-lessons/vl-delete-01")
        assert resp.status_code == 204

        # Verify it's gone
        resp2 = await admin_client.delete("/api/v1/admin/video-lessons/vl-delete-01")
        assert resp2.status_code == 404


# --- Course management tests ---


class TestCourseManagement:
    @pytest.mark.anyio
    async def test_create_course(self, teacher_client: AsyncClient) -> None:
        resp = await teacher_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "calc",
                "title": "Calculus 101",
                "course_type": "math",
                "content_mode": "video_quiz",
                "total_units": 5,
                "total_lessons": 20,
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Calculus 101"
        assert data["course_type"] == "math"
        assert data["content_mode"] == "video_quiz"
        assert data["is_published"] is False


# --- Upload tests ---


class TestVideoUpload:
    @pytest.mark.anyio
    async def test_upload_video(self, teacher_client: AsyncClient, tmp_path) -> None:
        video_data = b"\x00" * 1024  # 1KB fake video
        resp = await teacher_client.post(
            "/api/v1/admin/upload/video",
            files={"file": ("lesson.mp4", video_data, "video/mp4")},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["filename"] == "lesson.mp4"
        assert data["size_bytes"] == 1024
        assert "lesson.mp4" in data["url"]

    @pytest.mark.anyio
    async def test_upload_video_invalid_type(self, teacher_client: AsyncClient) -> None:
        resp = await teacher_client.post(
            "/api/v1/admin/upload/video",
            files={"file": ("doc.pdf", b"fake", "application/pdf")},
        )
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_upload_thumbnail(self, teacher_client: AsyncClient) -> None:
        img_data = b"\x89PNG" + b"\x00" * 100
        resp = await teacher_client.post(
            "/api/v1/admin/upload/thumbnail",
            files={"file": ("thumb.png", img_data, "image/png")},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["filename"] == "thumb.png"

    @pytest.mark.anyio
    async def test_upload_thumbnail_invalid_type(self, teacher_client: AsyncClient) -> None:
        resp = await teacher_client.post(
            "/api/v1/admin/upload/thumbnail",
            files={"file": ("doc.pdf", b"fake", "application/pdf")},
        )
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_student_cannot_upload(self, student_client: AsyncClient) -> None:
        resp = await student_client.post(
            "/api/v1/admin/upload/video",
            files={"file": ("lesson.mp4", b"\x00" * 100, "video/mp4")},
        )
        assert resp.status_code == 403


# --- Edge case tests ---


class TestVideoLessonEdgeCases:
    """Edge case tests for video lesson admin endpoints."""

    @pytest.mark.anyio
    async def test_create_video_lesson_nonexistent_course(self, admin_client: AsyncClient) -> None:
        """Creating a video lesson with a nonexistent course_id should 404."""
        fake_course_id = str(uuid.uuid4())
        resp = await admin_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-no-course",
                "course_id": fake_course_id,
                "unit_order": 1,
                "lesson_order": 1,
                "title": "Orphan Lesson",
                "video_url": "http://example.com/v.mp4",
                "video_duration_seconds": 300,
            },
        )
        assert resp.status_code == 404

    @pytest.mark.anyio
    async def test_update_nonexistent_video_lesson(self, admin_client: AsyncClient) -> None:
        """Updating a nonexistent video lesson should 404."""
        resp = await admin_client.patch(
            "/api/v1/admin/video-lessons/vl-does-not-exist",
            json={"title": "New Title"},
        )
        assert resp.status_code == 404

    @pytest.mark.anyio
    async def test_list_video_lessons_filter_by_course_id(
        self, admin_client: AsyncClient, math_course: Course
    ) -> None:
        """Listing video lessons filtered by course_id should return only matching lessons."""
        # Create two lessons for this course
        for i in range(2):
            await admin_client.post(
                "/api/v1/admin/video-lessons",
                json={
                    "id": f"vl-filter-{math_course.id}-{i}",
                    "course_id": str(math_course.id),
                    "unit_order": 1,
                    "lesson_order": i + 1,
                    "title": f"Filter Test {i}",
                    "video_url": "http://example.com/v.mp4",
                    "video_duration_seconds": 300,
                },
            )

        resp = await admin_client.get(
            "/api/v1/admin/video-lessons",
            params={"course_id": str(math_course.id)},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 2
        for vl in data["video_lessons"]:
            assert vl["course_id"] == str(math_course.id)

    @pytest.mark.anyio
    async def test_list_video_lessons_filter_nonexistent_course(
        self, admin_client: AsyncClient
    ) -> None:
        """Filtering video lessons by a nonexistent course_id should return empty."""
        fake_id = str(uuid.uuid4())
        resp = await admin_client.get(
            "/api/v1/admin/video-lessons",
            params={"course_id": fake_id},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["video_lessons"] == []


class TestCourseEdgeCases:
    """Edge case tests for course admin endpoints."""

    @pytest.mark.anyio
    async def test_create_course_invalid_course_type(self, teacher_client: AsyncClient) -> None:
        """Creating a course with invalid course_type should 422."""
        resp = await teacher_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "fr",
                "title": "French 101",
                "course_type": "invalid_type",
                "content_mode": "exercise",
                "total_units": 1,
                "total_lessons": 5,
            },
        )
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_create_course_invalid_content_mode(self, teacher_client: AsyncClient) -> None:
        """Creating a course with invalid content_mode should 422."""
        resp = await teacher_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "fr",
                "title": "French 101",
                "course_type": "language",
                "content_mode": "invalid_mode",
                "total_units": 1,
                "total_lessons": 5,
            },
        )
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_create_course_duplicate_title_different_language_pair(
        self, teacher_client: AsyncClient
    ) -> None:
        """Courses with the same title but different language pairs should succeed."""
        resp1 = await teacher_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "de",
                "title": "Language Basics",
                "course_type": "language",
                "content_mode": "exercise",
                "total_units": 1,
                "total_lessons": 5,
            },
        )
        assert resp1.status_code == 201

        resp2 = await teacher_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "it",
                "title": "Language Basics",
                "course_type": "language",
                "content_mode": "exercise",
                "total_units": 1,
                "total_lessons": 5,
            },
        )
        assert resp2.status_code == 201
        assert resp1.json()["id"] != resp2.json()["id"]

    @pytest.mark.anyio
    async def test_create_course_duplicate_language_pair_fails(
        self, teacher_client: AsyncClient
    ) -> None:
        """BUG: Courses with the same (language_from, language_to) pair cause an unhandled
        IntegrityError due to a UNIQUE constraint on (language_from, language_to).
        The AdminService.create_course should catch IntegrityError and return ConflictError
        so the API responds with 409 instead of 500.

        This test documents the bug — it currently raises IntegrityError.
        """
        body = {
            "language_from": "en",
            "language_to": "ko",
            "title": "Korean 1",
            "course_type": "language",
            "content_mode": "exercise",
            "total_units": 1,
            "total_lessons": 5,
        }
        resp1 = await teacher_client.post("/api/v1/admin/courses", json=body)
        assert resp1.status_code == 201

        body["title"] = "Korean 2"
        resp2 = await teacher_client.post("/api/v1/admin/courses", json=body)
        assert resp2.status_code == 409

    @pytest.mark.anyio
    async def test_create_course_missing_required_fields(self, teacher_client: AsyncClient) -> None:
        """Creating a course without required fields should 422."""
        resp = await teacher_client.post(
            "/api/v1/admin/courses",
            json={"title": "Incomplete"},
        )
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_create_course_empty_title(self, teacher_client: AsyncClient) -> None:
        """Creating a course with empty title should 422 (min_length=1)."""
        resp = await teacher_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "ja",
                "title": "",
                "total_units": 1,
                "total_lessons": 5,
            },
        )
        assert resp.status_code == 422


class TestVideoUploadEdgeCases:
    """Edge case tests for file upload endpoints."""

    @pytest.mark.anyio
    async def test_upload_video_empty_file(self, teacher_client: AsyncClient) -> None:
        """Uploading an empty video file should succeed (server accepts 0-byte files)."""
        resp = await teacher_client.post(
            "/api/v1/admin/upload/video",
            files={"file": ("empty.mp4", b"", "video/mp4")},
        )
        # 0-byte file — may succeed or fail based on implementation.
        # The key: content type is valid so it passes type check.
        # If the system accepts it, size_bytes=0.
        assert resp.status_code == 201
        assert resp.json()["size_bytes"] == 0

    @pytest.mark.anyio
    async def test_upload_video_wrong_extension_with_valid_content_type(
        self, teacher_client: AsyncClient
    ) -> None:
        """Content-type validation is based on declared type, not extension."""
        resp = await teacher_client.post(
            "/api/v1/admin/upload/video",
            files={"file": ("video.txt", b"\x00" * 100, "video/mp4")},
        )
        # Content type is valid, so the upload should succeed
        assert resp.status_code == 201

    @pytest.mark.anyio
    async def test_upload_thumbnail_wrong_content_type(self, teacher_client: AsyncClient) -> None:
        """Uploading a video as thumbnail should 422."""
        resp = await teacher_client.post(
            "/api/v1/admin/upload/thumbnail",
            files={"file": ("thumb.mp4", b"\x00" * 100, "video/mp4")},
        )
        assert resp.status_code == 422


# --- Security: unauthenticated access tests ---


class TestUnauthenticatedAdminAccess:
    """Verify all admin endpoints reject unauthenticated requests."""

    @pytest.mark.anyio
    async def test_list_users_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.get("/api/v1/admin/users")
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_update_role_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.patch(
            f"/api/v1/admin/users/{uuid.uuid4()}/role",
            json={"role": "teacher"},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_create_course_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "fr",
                "title": "French 101",
                "total_units": 1,
                "total_lessons": 5,
            },
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_list_video_lessons_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.get("/api/v1/admin/video-lessons")
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_create_video_lesson_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/admin/video-lessons",
            json={
                "id": "vl-unauth",
                "course_id": str(uuid.uuid4()),
                "unit_order": 1,
                "lesson_order": 1,
                "title": "Unauth",
                "video_url": "http://example.com/v.mp4",
                "video_duration_seconds": 300,
            },
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_update_video_lesson_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.patch(
            "/api/v1/admin/video-lessons/some-id",
            json={"title": "Hacked"},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_delete_video_lesson_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.delete("/api/v1/admin/video-lessons/some-id")
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_upload_video_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/admin/upload/video",
            files={"file": ("test.mp4", b"\x00" * 100, "video/mp4")},
        )
        assert resp.status_code in (401, 403)

    @pytest.mark.anyio
    async def test_upload_thumbnail_unauthenticated(self, async_client: AsyncClient) -> None:
        resp = await async_client.post(
            "/api/v1/admin/upload/thumbnail",
            files={"file": ("test.png", b"\x00" * 100, "image/png")},
        )
        assert resp.status_code in (401, 403)


# --- Security: student role enforcement tests ---


class TestStudentCannotAccessAdminEndpoints:
    """Verify students cannot access any admin endpoints beyond the basics already tested."""

    @pytest.mark.anyio
    async def test_student_cannot_create_course(self, student_client: AsyncClient) -> None:
        resp = await student_client.post(
            "/api/v1/admin/courses",
            json={
                "language_from": "en",
                "language_to": "fr",
                "title": "French 101",
                "total_units": 1,
                "total_lessons": 5,
            },
        )
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_student_cannot_list_video_lessons(self, student_client: AsyncClient) -> None:
        resp = await student_client.get("/api/v1/admin/video-lessons")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_student_cannot_update_video_lesson(self, student_client: AsyncClient) -> None:
        resp = await student_client.patch(
            "/api/v1/admin/video-lessons/some-id",
            json={"title": "Hacked"},
        )
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_student_cannot_delete_video_lesson(self, student_client: AsyncClient) -> None:
        resp = await student_client.delete("/api/v1/admin/video-lessons/some-id")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_student_cannot_update_user_role(self, student_client: AsyncClient) -> None:
        resp = await student_client.patch(
            f"/api/v1/admin/users/{uuid.uuid4()}/role",
            json={"role": "admin"},
        )
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_student_cannot_upload_thumbnail(self, student_client: AsyncClient) -> None:
        resp = await student_client.post(
            "/api/v1/admin/upload/thumbnail",
            files={"file": ("test.png", b"\x89PNG" + b"\x00" * 100, "image/png")},
        )
        assert resp.status_code == 403


# --- Security: SQL injection tests ---


class TestSQLInjectionPrevention:
    """Verify query parameters cannot be used for SQL injection."""

    @pytest.mark.anyio
    async def test_list_users_role_injection(self, admin_client: AsyncClient) -> None:
        """Attempting SQL injection via role filter should be rejected by validation."""
        resp = await admin_client.get("/api/v1/admin/users?role=admin' OR '1'='1")
        # Pattern validation should reject this
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_update_role_injection(self, admin_client: AsyncClient) -> None:
        """SQL injection in role update body should be rejected by validation."""
        fake_id = str(uuid.uuid4())
        resp = await admin_client.patch(
            f"/api/v1/admin/users/{fake_id}/role",
            json={"role": "admin'; DROP TABLE users; --"},
        )
        assert resp.status_code == 422

    @pytest.mark.anyio
    async def test_video_lesson_id_injection(self, admin_client: AsyncClient) -> None:
        """SQL injection in video lesson ID path param should return 404, not error."""
        resp = await admin_client.patch(
            "/api/v1/admin/video-lessons/'; DROP TABLE video_lessons; --",
            json={"title": "Hacked"},
        )
        assert resp.status_code == 404
