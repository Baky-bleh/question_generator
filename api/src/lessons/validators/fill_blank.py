from __future__ import annotations

from ._result import ValidatorResult


def validate_fill_blank(exercise_data: dict, user_answer: str | list[str]) -> ValidatorResult:
    """Validate a fill-in-the-blank answer against accepted answers (case-insensitive)."""
    correct_answers: list[str] = exercise_data["correct_answers"]
    answer_text = user_answer if isinstance(user_answer, str) else user_answer[0]
    normalized = answer_text.strip().lower()

    is_correct = any(ca.strip().lower() == normalized for ca in correct_answers)

    return ValidatorResult(
        correct=is_correct,
        correct_answer=correct_answers[0],
        explanation=exercise_data.get("explanation"),
    )
