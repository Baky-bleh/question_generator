from __future__ import annotations

from pydantic import BaseModel


class LessonOut(BaseModel):
    id: str
    title: str
    content_url: str
    exercise_count: int
    estimated_minutes: int


class ExerciseSubmitRequest(BaseModel):
    exercise_id: str
    answer: str | list[str]
    time_seconds: int = 0


class ExerciseSubmitResponse(BaseModel):
    correct: bool
    correct_answer: str
    explanation: str | None = None
    xp_earned: int
