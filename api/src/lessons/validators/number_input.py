from __future__ import annotations

from ._result import ValidatorResult


def validate_number_input(exercise_data: dict, user_answer: str | list[str]) -> ValidatorResult:
    """Validate a numeric answer against the correct answer within a tolerance."""
    correct_answer = exercise_data["correct_answer"]
    tolerance = exercise_data.get("tolerance", 0)
    correct_answer_str = str(correct_answer)
    explanation = exercise_data.get("explanation")

    # Normalize input: extract string from list if needed
    raw = user_answer if isinstance(user_answer, str) else user_answer[0] if user_answer else ""

    try:
        parsed = float(raw.strip())
    except (ValueError, AttributeError):
        return ValidatorResult(
            correct=False,
            correct_answer=correct_answer_str,
            explanation=explanation,
        )

    is_correct = abs(parsed - correct_answer) <= tolerance

    return ValidatorResult(
        correct=is_correct,
        correct_answer=correct_answer_str,
        explanation=explanation,
    )
