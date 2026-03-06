from __future__ import annotations

import json
from pathlib import Path

from src.core.config import Settings


class ContentLoader:
    """Loads course content from the local filesystem.

    In production, this would also support loading from S3.
    For Phase 1, only local filesystem is implemented.
    """

    def __init__(self, settings: Settings) -> None:
        self._content_dir = Path(settings.CONTENT_DIR)

    def load_manifest(self, course_slug: str) -> dict:
        """Load a course manifest JSON file."""
        manifest_path = self._content_dir / "courses" / course_slug / "manifest.json"
        if not manifest_path.exists():
            raise FileNotFoundError(f"Course manifest not found: {course_slug}")
        with open(manifest_path) as f:
            return json.load(f)

    def load_lesson(self, course_slug: str, unit_order: int, lesson_order: int) -> dict:
        """Load a lesson JSON file."""
        lesson_path = (
            self._content_dir
            / "courses"
            / course_slug
            / "units"
            / str(unit_order)
            / "lessons"
            / f"{lesson_order}.json"
        )
        if not lesson_path.exists():
            raise FileNotFoundError(
                f"Lesson not found: {course_slug}/units/{unit_order}/lessons/{lesson_order}"
            )
        with open(lesson_path) as f:
            return json.load(f)

    def list_course_slugs(self) -> list[str]:
        """List all available course slugs."""
        courses_dir = self._content_dir / "courses"
        if not courses_dir.exists():
            return []
        return sorted(
            d.name for d in courses_dir.iterdir() if d.is_dir() and (d / "manifest.json").exists()
        )
