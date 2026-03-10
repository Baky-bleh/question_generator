from __future__ import annotations

import os
from abc import ABC, abstractmethod
from pathlib import Path

from src.core.config import settings


class VideoStorage(ABC):
    """Abstract base class for video storage backends."""

    @abstractmethod
    def get_playback_url(self, filename: str) -> str:
        """Return a playback URL for the given video filename."""
        ...

    @abstractmethod
    def store_video(self, filename: str, data: bytes) -> str:
        """Store video data and return the storage path/URL."""
        ...

    @abstractmethod
    def delete_video(self, filename: str) -> None:
        """Delete a video by filename."""
        ...


class LocalVideoBackend(VideoStorage):
    """Serves mp4 files from local filesystem via FastAPI static files mount."""

    def __init__(self) -> None:
        self._base_url = "http://localhost:8000/static/videos"
        self._storage_dir = Path(settings.VIDEO_LOCAL_DIR)

    def get_playback_url(self, filename: str) -> str:
        return f"{self._base_url}/{filename}"

    def store_video(self, filename: str, data: bytes) -> str:
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        file_path = self._storage_dir / filename
        file_path.write_bytes(data)
        return str(file_path)

    def delete_video(self, filename: str) -> None:
        file_path = self._storage_dir / filename
        if file_path.exists():
            os.remove(file_path)


class MuxVideoBackend(VideoStorage):
    """Mux integration stub — deferred to production deployment phase."""

    def get_playback_url(self, filename: str) -> str:
        raise NotImplementedError("Mux integration deferred to production deployment phase.")

    def store_video(self, filename: str, data: bytes) -> str:
        raise NotImplementedError("Mux integration deferred to production deployment phase.")

    def delete_video(self, filename: str) -> None:
        raise NotImplementedError("Mux integration deferred to production deployment phase.")


def get_video_storage() -> VideoStorage:
    """Factory function returning the configured video storage backend."""
    if settings.VIDEO_BACKEND == "mux":
        return MuxVideoBackend()
    return LocalVideoBackend()
