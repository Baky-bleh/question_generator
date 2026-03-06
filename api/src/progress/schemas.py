from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from src.progress.xp import XPBreakdown


class LessonCompleteRequest(BaseModel):
    score: int = Field(..., ge=0, le=100)
    time_seconds: int = Field(..., gt=0)
    mistakes: int = Field(..., ge=0)
    perfect: bool


class NextLesson(BaseModel):
    id: str
    title: str


class StreakInfo(BaseModel):
    current: int
    is_new_record: bool


class LessonCompleteResponse(BaseModel):
    xp_earned: int
    xp_breakdown: XPBreakdown
    streak: StreakInfo
    achievements_unlocked: list[str] = Field(default_factory=list)
    next_lesson: NextLesson | None = None


class TodayStats(BaseModel):
    lessons_completed: int
    xp_earned: int
    goal_met: bool


class CourseProgressSummary(BaseModel):
    course_id: UUID
    title: str
    progress: float
    current_streak: int


class ProgressSummaryResponse(BaseModel):
    total_xp: int
    level: int
    courses: list[CourseProgressSummary]
    today: TodayStats


class CourseProgressResponse(BaseModel):
    course_id: UUID
    units_completed: int
    units_total: int
    lessons_completed: int
    lessons_total: int
    total_xp_in_course: int
    words_learned: int
    time_spent_minutes: int
