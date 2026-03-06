from __future__ import annotations

from pydantic import BaseModel


class SM2Result(BaseModel):
    ease_factor: float
    interval: int
    repetitions: int


DEFAULT_EASE_FACTOR: float = 2.5
MIN_EASE_FACTOR: float = 1.3


def sm2_algorithm(
    quality: int,
    ease_factor: float,
    interval: int,
    repetitions: int,
) -> SM2Result:
    """Standard SM-2 spaced repetition algorithm.

    Args:
        quality: Response quality 0-5 (0=total failure, 5=perfect recall).
        ease_factor: Current ease factor (>= 1.3).
        interval: Current interval in days.
        repetitions: Number of consecutive correct responses.

    Returns:
        SM2Result with new ease_factor, interval, and repetitions.
    """
    if quality < 0 or quality > 5:
        raise ValueError(f"Quality must be 0-5, got {quality}")

    # Update ease factor
    new_ef = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(new_ef, MIN_EASE_FACTOR)

    if quality < 3:
        # Failed recall: reset repetitions and interval
        new_repetitions = 0
        new_interval = 1
    else:
        # Successful recall
        new_repetitions = repetitions + 1
        if new_repetitions == 1:
            new_interval = 1
        elif new_repetitions == 2:
            new_interval = 6
        else:
            new_interval = round(interval * new_ef)

    return SM2Result(
        ease_factor=round(new_ef, 2),
        interval=new_interval,
        repetitions=new_repetitions,
    )
