from __future__ import annotations

from ._result import ValidatorResult


def validate_multiple_choice(exercise_data: dict, user_answer: str | list[str]) -> ValidatorResult:
    """Validate a multiple choice answer by comparing the selected index."""
    correct_index = exercise_data["correct_index"]
    choices = exercise_data["choices"]
    correct_text = choices[correct_index]

    try:
        selected = int(user_answer) if isinstance(user_answer, str) else int(user_answer[0])
    except (ValueError, IndexError):
        return ValidatorResult(
            correct=False,
            correct_answer=correct_text,
            explanation=exercise_data.get("explanation"),
        )

    return ValidatorResult(
        correct=selected == correct_index,
        correct_answer=correct_text,
        explanation=exercise_data.get("explanation"),
    )
