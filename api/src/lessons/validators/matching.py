from __future__ import annotations

import json

from ._result import ValidatorResult


def validate_matching(exercise_data: dict, user_answer: str | list[str]) -> ValidatorResult:
    """Validate matching pairs.

    User answer is a JSON string or list of strings representing paired indices
    or a JSON-encoded list of [left, right] pairs.
    """
    pairs = exercise_data["pairs"]
    correct_mapping = {p["left"]: p["right"] for p in pairs}
    correct_str = ", ".join(f"{p['left']} = {p['right']}" for p in pairs)

    try:
        if isinstance(user_answer, str):
            parsed = json.loads(user_answer)
        else:
            parsed = user_answer

        if not isinstance(parsed, list):
            return ValidatorResult(correct=False, correct_answer=correct_str)

        user_mapping: dict[str, str] = {}
        for item in parsed:
            if isinstance(item, list) and len(item) == 2:
                user_mapping[str(item[0]).strip()] = str(item[1]).strip()
            elif isinstance(item, str) and ":" in item:
                left, right = item.split(":", 1)
                user_mapping[left.strip()] = right.strip()
    except (json.JSONDecodeError, TypeError):
        return ValidatorResult(correct=False, correct_answer=correct_str)

    is_correct = user_mapping == correct_mapping

    return ValidatorResult(
        correct=is_correct,
        correct_answer=correct_str,
        explanation=exercise_data.get("explanation"),
    )
