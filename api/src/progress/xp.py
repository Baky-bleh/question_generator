from __future__ import annotations

from pydantic import BaseModel


class XPBreakdown(BaseModel):
    base: int
    perfect_bonus: int
    streak_bonus: int
    speed_bonus: int
    total: int


BASE_XP: int = 10
PERFECT_BONUS_XP: int = 5
MAX_STREAK_BONUS: int = 7
MAX_SPEED_BONUS: int = 3


def calculate_xp(
    score: int,
    time_seconds: int,
    streak_count: int,
    expected_time: int = 300,
) -> XPBreakdown:
    """Calculate XP earned for a lesson completion.

    Args:
        score: Lesson score 0-100.
        time_seconds: Time taken in seconds.
        streak_count: Current streak count (before this lesson).
        expected_time: Expected completion time in seconds (default 300).

    Returns:
        XPBreakdown with base, perfect_bonus, streak_bonus, speed_bonus, total.
    """
    base = BASE_XP

    perfect_bonus = PERFECT_BONUS_XP if score == 100 else 0

    streak_bonus = min(streak_count, MAX_STREAK_BONUS)

    # Speed bonus: 0-3 based on how much faster than expected time
    if time_seconds <= 0 or time_seconds >= expected_time:
        speed_bonus = 0
    else:
        ratio = time_seconds / expected_time
        if ratio <= 0.5:
            speed_bonus = MAX_SPEED_BONUS
        elif ratio <= 0.7:
            speed_bonus = 2
        elif ratio <= 0.9:
            speed_bonus = 1
        else:
            speed_bonus = 0

    total = base + perfect_bonus + streak_bonus + speed_bonus

    return XPBreakdown(
        base=base,
        perfect_bonus=perfect_bonus,
        streak_bonus=streak_bonus,
        speed_bonus=speed_bonus,
        total=total,
    )
