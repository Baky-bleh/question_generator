from __future__ import annotations

import pytest

from src.srs.sm2 import MIN_EASE_FACTOR, sm2_algorithm


class TestSM2Algorithm:
    def test_first_correct_response(self) -> None:
        result = sm2_algorithm(quality=4, ease_factor=2.5, interval=1, repetitions=0)
        assert result.repetitions == 1
        assert result.interval == 1

    def test_second_correct_response(self) -> None:
        result = sm2_algorithm(quality=4, ease_factor=2.5, interval=1, repetitions=1)
        assert result.repetitions == 2
        assert result.interval == 6

    def test_third_correct_response(self) -> None:
        result = sm2_algorithm(quality=4, ease_factor=2.5, interval=6, repetitions=2)
        assert result.repetitions == 3
        assert result.interval == round(6 * result.ease_factor)

    def test_perfect_recall_increases_ease_factor(self) -> None:
        result = sm2_algorithm(quality=5, ease_factor=2.5, interval=1, repetitions=0)
        assert result.ease_factor > 2.5

    def test_poor_recall_decreases_ease_factor(self) -> None:
        result = sm2_algorithm(quality=3, ease_factor=2.5, interval=1, repetitions=0)
        assert result.ease_factor < 2.5

    def test_failed_recall_resets_repetitions(self) -> None:
        result = sm2_algorithm(quality=2, ease_factor=2.5, interval=10, repetitions=5)
        assert result.repetitions == 0
        assert result.interval == 1

    def test_quality_0_resets(self) -> None:
        result = sm2_algorithm(quality=0, ease_factor=2.5, interval=20, repetitions=10)
        assert result.repetitions == 0
        assert result.interval == 1

    def test_quality_1_resets(self) -> None:
        result = sm2_algorithm(quality=1, ease_factor=2.5, interval=15, repetitions=7)
        assert result.repetitions == 0
        assert result.interval == 1

    def test_quality_3_is_passing(self) -> None:
        result = sm2_algorithm(quality=3, ease_factor=2.5, interval=1, repetitions=0)
        assert result.repetitions == 1

    def test_ease_factor_never_below_minimum(self) -> None:
        result = sm2_algorithm(quality=0, ease_factor=MIN_EASE_FACTOR, interval=1, repetitions=0)
        assert result.ease_factor >= MIN_EASE_FACTOR

    def test_ease_factor_minimum_after_many_failures(self) -> None:
        ef = 2.5
        for _ in range(20):
            r = sm2_algorithm(quality=0, ease_factor=ef, interval=1, repetitions=0)
            ef = r.ease_factor
        assert ef >= MIN_EASE_FACTOR

    def test_interval_grows_with_repetitions(self) -> None:
        ef = 2.5
        interval = 1
        reps = 0
        intervals = []
        for _ in range(5):
            r = sm2_algorithm(quality=5, ease_factor=ef, interval=interval, repetitions=reps)
            ef = r.ease_factor
            interval = r.interval
            reps = r.repetitions
            intervals.append(interval)
        # Intervals should be non-decreasing
        for i in range(1, len(intervals)):
            assert intervals[i] >= intervals[i - 1]

    def test_invalid_quality_raises(self) -> None:
        with pytest.raises(ValueError):
            sm2_algorithm(quality=-1, ease_factor=2.5, interval=1, repetitions=0)
        with pytest.raises(ValueError):
            sm2_algorithm(quality=6, ease_factor=2.5, interval=1, repetitions=0)

    def test_ease_factor_rounded_to_two_decimals(self) -> None:
        result = sm2_algorithm(quality=4, ease_factor=2.5, interval=1, repetitions=0)
        assert result.ease_factor == round(result.ease_factor, 2)

    def test_standard_sm2_test_vector(self) -> None:
        """Standard SM-2 sequence: quality 5 five times starting from defaults."""
        ef = 2.5
        interval = 1
        reps = 0
        for _ in range(5):
            r = sm2_algorithm(quality=5, ease_factor=ef, interval=interval, repetitions=reps)
            ef = r.ease_factor
            interval = r.interval
            reps = r.repetitions
        # After 5 perfect reviews, interval should be large
        assert interval > 30
        assert ef > 2.5
