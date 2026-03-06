from __future__ import annotations

import json

from ._result import ValidatorResult


def validate_word_arrange(exercise_data: dict, user_answer: str | list[str]) -> ValidatorResult:
    """Validate word arrangement answer against the correct order."""
    correct_order: list[str] = exercise_data["correct_order"]
    correct_str = " ".join(correct_order)

    if isinstance(user_answer, str):
        try:
            words = json.loads(user_answer)
        except json.JSONDecodeError:
            words = user_answer.split()
    else:
        words = user_answer

    normalized_user = [w.strip().lower() for w in words if w.strip()]
    normalized_correct = [w.strip().lower() for w in correct_order]

    is_correct = normalized_user == normalized_correct

    return ValidatorResult(
        correct=is_correct,
        correct_answer=correct_str,
        explanation=exercise_data.get("explanation"),
    )
