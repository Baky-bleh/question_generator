from __future__ import annotations

from ._result import ValidatorResult
from .fill_blank import validate_fill_blank
from .listening import validate_listening
from .matching import validate_matching
from .multiple_choice import validate_multiple_choice
from .number_input import validate_number_input
from .translation import validate_translation
from .word_arrange import validate_word_arrange


_VALIDATORS: dict[str, object] = {
    "multiple_choice": validate_multiple_choice,
    "fill_blank": validate_fill_blank,
    "matching": validate_matching,
    "listening": validate_listening,
    "number_input": validate_number_input,
    "word_arrange": validate_word_arrange,
    "translation": validate_translation,
}


def validate_answer(
    exercise_type: str,
    exercise_data: dict,
    user_answer: str | list[str],
) -> ValidatorResult:
    """Dispatch to the correct validator based on exercise type."""
    validator = _VALIDATORS.get(exercise_type)
    if validator is None:
        raise ValueError(f"Unknown exercise type: '{exercise_type}'")
    return validator(exercise_data, user_answer)
