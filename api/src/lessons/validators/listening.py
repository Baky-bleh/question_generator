from __future__ import annotations

from ._result import ValidatorResult


def _levenshtein(s1: str, s2: str) -> int:
    """Compute Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return _levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def validate_listening(exercise_data: dict, user_answer: str | list[str]) -> ValidatorResult:
    """Validate listening exercise answer, allowing for acceptable typos."""
    correct_text = exercise_data["correct_text"]
    acceptable_typos = exercise_data.get("acceptable_typos", 1)
    answer_text = user_answer if isinstance(user_answer, str) else user_answer[0]

    distance = _levenshtein(answer_text.strip().lower(), correct_text.strip().lower())
    is_correct = distance <= acceptable_typos

    return ValidatorResult(
        correct=is_correct,
        correct_answer=correct_text,
        explanation=exercise_data.get("explanation"),
    )
