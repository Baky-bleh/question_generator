from __future__ import annotations

import pytest

from src.progress.xp import BASE_XP, MAX_SPEED_BONUS, MAX_STREAK_BONUS, PERFECT_BONUS_XP, calculate_xp


class TestCalculateXP:
    def test_base_xp_only(self) -> None:
        result = calculate_xp(score=80, time_seconds=300, streak_count=0)
        assert result.base == BASE_XP
        assert result.perfect_bonus == 0
        assert result.streak_bonus == 0
        assert result.speed_bonus == 0
        assert result.total == BASE_XP

    def test_perfect_bonus(self) -> None:
        result = calculate_xp(score=100, time_seconds=300, streak_count=0)
        assert result.perfect_bonus == PERFECT_BONUS_XP
        assert result.total == BASE_XP + PERFECT_BONUS_XP

    def test_no_perfect_bonus_at_99(self) -> None:
        result = calculate_xp(score=99, time_seconds=300, streak_count=0)
        assert result.perfect_bonus == 0

    def test_streak_bonus_scales_linearly(self) -> None:
        for streak in range(1, MAX_STREAK_BONUS + 1):
            result = calculate_xp(score=80, time_seconds=300, streak_count=streak)
            assert result.streak_bonus == streak

    def test_streak_bonus_capped_at_max(self) -> None:
        result = calculate_xp(score=80, time_seconds=300, streak_count=100)
        assert result.streak_bonus == MAX_STREAK_BONUS

    def test_streak_bonus_zero_for_no_streak(self) -> None:
        result = calculate_xp(score=80, time_seconds=300, streak_count=0)
        assert result.streak_bonus == 0

    def test_speed_bonus_max_at_half_time(self) -> None:
        result = calculate_xp(score=80, time_seconds=150, streak_count=0, expected_time=300)
        assert result.speed_bonus == MAX_SPEED_BONUS

    def test_speed_bonus_max_at_very_fast(self) -> None:
        result = calculate_xp(score=80, time_seconds=60, streak_count=0, expected_time=300)
        assert result.speed_bonus == MAX_SPEED_BONUS

    def test_speed_bonus_2_at_70_percent(self) -> None:
        result = calculate_xp(score=80, time_seconds=180, streak_count=0, expected_time=300)
        assert result.speed_bonus == 2

    def test_speed_bonus_1_at_80_percent(self) -> None:
        result = calculate_xp(score=80, time_seconds=240, streak_count=0, expected_time=300)
        assert result.speed_bonus == 1

    def test_speed_bonus_0_at_expected_time(self) -> None:
        result = calculate_xp(score=80, time_seconds=300, streak_count=0, expected_time=300)
        assert result.speed_bonus == 0

    def test_speed_bonus_0_when_slow(self) -> None:
        result = calculate_xp(score=80, time_seconds=600, streak_count=0, expected_time=300)
        assert result.speed_bonus == 0

    def test_speed_bonus_0_for_zero_time(self) -> None:
        result = calculate_xp(score=80, time_seconds=0, streak_count=0)
        assert result.speed_bonus == 0

    def test_all_bonuses_combined(self) -> None:
        result = calculate_xp(score=100, time_seconds=100, streak_count=5, expected_time=300)
        assert result.base == BASE_XP
        assert result.perfect_bonus == PERFECT_BONUS_XP
        assert result.streak_bonus == 5
        assert result.speed_bonus == MAX_SPEED_BONUS
        assert result.total == BASE_XP + PERFECT_BONUS_XP + 5 + MAX_SPEED_BONUS

    def test_total_is_sum_of_components(self) -> None:
        result = calculate_xp(score=100, time_seconds=120, streak_count=3)
        expected = result.base + result.perfect_bonus + result.streak_bonus + result.speed_bonus
        assert result.total == expected

    def test_minimum_xp_is_base(self) -> None:
        result = calculate_xp(score=0, time_seconds=9999, streak_count=0)
        assert result.total == BASE_XP
