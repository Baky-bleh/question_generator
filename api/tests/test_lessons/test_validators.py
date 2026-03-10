from __future__ import annotations

import json

import pytest

from src.lessons.validators import ValidatorResult, validate_answer


class TestMultipleChoice:
    def test_correct_answer(self) -> None:
        data = {"choices": ["a", "b", "c", "d"], "correct_index": 2}
        result = validate_answer("multiple_choice", data, "2")
        assert result.correct is True
        assert result.correct_answer == "c"

    def test_wrong_answer(self) -> None:
        data = {"choices": ["a", "b", "c", "d"], "correct_index": 2}
        result = validate_answer("multiple_choice", data, "0")
        assert result.correct is False
        assert result.correct_answer == "c"

    def test_with_explanation(self) -> None:
        data = {"choices": ["a", "b"], "correct_index": 0, "explanation": "A is correct."}
        result = validate_answer("multiple_choice", data, "0")
        assert result.explanation == "A is correct."

    def test_invalid_answer_string(self) -> None:
        data = {"choices": ["a", "b"], "correct_index": 0}
        result = validate_answer("multiple_choice", data, "not-a-number")
        assert result.correct is False

    def test_list_answer(self) -> None:
        data = {"choices": ["a", "b", "c"], "correct_index": 1}
        result = validate_answer("multiple_choice", data, ["1"])
        assert result.correct is True

    def test_empty_list_answer(self) -> None:
        data = {"choices": ["a", "b"], "correct_index": 0}
        result = validate_answer("multiple_choice", data, [])
        assert result.correct is False


class TestFillBlank:
    def test_exact_match(self) -> None:
        data = {"correct_answers": ["noches"]}
        result = validate_answer("fill_blank", data, "noches")
        assert result.correct is True

    def test_case_insensitive(self) -> None:
        data = {"correct_answers": ["noches"]}
        result = validate_answer("fill_blank", data, "Noches")
        assert result.correct is True

    def test_multiple_accepted(self) -> None:
        data = {"correct_answers": ["noches", "Noches"]}
        result = validate_answer("fill_blank", data, "NOCHES")
        assert result.correct is True

    def test_wrong_answer(self) -> None:
        data = {"correct_answers": ["noches"]}
        result = validate_answer("fill_blank", data, "dias")
        assert result.correct is False

    def test_whitespace_trimming(self) -> None:
        data = {"correct_answers": ["noches"]}
        result = validate_answer("fill_blank", data, "  noches  ")
        assert result.correct is True

    def test_returns_first_correct_answer(self) -> None:
        data = {"correct_answers": ["primary", "secondary"]}
        result = validate_answer("fill_blank", data, "secondary")
        assert result.correct is True
        assert result.correct_answer == "primary"


class TestMatching:
    def test_correct_pairs(self) -> None:
        pairs = [{"left": "A", "right": "1"}, {"left": "B", "right": "2"}]
        answer = json.dumps([["A", "1"], ["B", "2"]])
        result = validate_answer("matching", {"pairs": pairs}, answer)
        assert result.correct is True

    def test_wrong_pairs(self) -> None:
        pairs = [{"left": "A", "right": "1"}, {"left": "B", "right": "2"}]
        answer = json.dumps([["A", "2"], ["B", "1"]])
        result = validate_answer("matching", {"pairs": pairs}, answer)
        assert result.correct is False

    def test_incomplete_pairs(self) -> None:
        pairs = [{"left": "A", "right": "1"}, {"left": "B", "right": "2"}]
        answer = json.dumps([["A", "1"]])
        result = validate_answer("matching", {"pairs": pairs}, answer)
        assert result.correct is False

    def test_invalid_json(self) -> None:
        pairs = [{"left": "A", "right": "1"}]
        result = validate_answer("matching", {"pairs": pairs}, "not json")
        assert result.correct is False

    def test_colon_format(self) -> None:
        pairs = [{"left": "A", "right": "1"}, {"left": "B", "right": "2"}]
        answer = ["A:1", "B:2"]
        result = validate_answer("matching", {"pairs": pairs}, answer)
        assert result.correct is True


class TestListening:
    def test_exact_match(self) -> None:
        data = {"correct_text": "Hola", "acceptable_typos": 0}
        result = validate_answer("listening", data, "Hola")
        assert result.correct is True

    def test_case_insensitive(self) -> None:
        data = {"correct_text": "Hola", "acceptable_typos": 0}
        result = validate_answer("listening", data, "hola")
        assert result.correct is True

    def test_within_typo_tolerance(self) -> None:
        data = {"correct_text": "Hola", "acceptable_typos": 1}
        result = validate_answer("listening", data, "Holaa")
        assert result.correct is True

    def test_beyond_typo_tolerance(self) -> None:
        data = {"correct_text": "Hola", "acceptable_typos": 0}
        result = validate_answer("listening", data, "Holaa")
        assert result.correct is False

    def test_default_typo_tolerance(self) -> None:
        data = {"correct_text": "Buenos días"}
        result = validate_answer("listening", data, "Buenos dias")
        assert result.correct is True  # 1 char difference, default tolerance is 1

    def test_completely_wrong(self) -> None:
        data = {"correct_text": "Hola", "acceptable_typos": 1}
        result = validate_answer("listening", data, "Adiós")
        assert result.correct is False


class TestWordArrange:
    def test_correct_order_list(self) -> None:
        data = {"correct_order": ["Buenas", "tardes"]}
        result = validate_answer("word_arrange", data, ["Buenas", "tardes"])
        assert result.correct is True

    def test_wrong_order_list(self) -> None:
        data = {"correct_order": ["Buenas", "tardes"]}
        result = validate_answer("word_arrange", data, ["tardes", "Buenas"])
        assert result.correct is False

    def test_case_insensitive(self) -> None:
        data = {"correct_order": ["Buenas", "tardes"]}
        result = validate_answer("word_arrange", data, ["buenas", "Tardes"])
        assert result.correct is True

    def test_string_input_space_separated(self) -> None:
        data = {"correct_order": ["Buenas", "tardes"]}
        result = validate_answer("word_arrange", data, "Buenas tardes")
        assert result.correct is True

    def test_json_string_input(self) -> None:
        data = {"correct_order": ["Buenas", "tardes"]}
        result = validate_answer("word_arrange", data, '["Buenas", "tardes"]')
        assert result.correct is True

    def test_correct_answer_value(self) -> None:
        data = {"correct_order": ["Buenas", "tardes"]}
        result = validate_answer("word_arrange", data, ["Buenas", "tardes"])
        assert result.correct_answer == "Buenas tardes"


class TestTranslation:
    def test_exact_match(self) -> None:
        data = {"correct_answers": ["Buenos días"]}
        result = validate_answer("translation", data, "Buenos días")
        assert result.correct is True

    def test_case_insensitive(self) -> None:
        data = {"correct_answers": ["Buenos días"]}
        result = validate_answer("translation", data, "buenos días")
        assert result.correct is True

    def test_multiple_accepted(self) -> None:
        data = {"correct_answers": ["Buenos días", "Buenos dias"]}
        result = validate_answer("translation", data, "buenos dias")
        assert result.correct is True

    def test_wrong_translation(self) -> None:
        data = {"correct_answers": ["Buenos días"]}
        result = validate_answer("translation", data, "Buenas noches")
        assert result.correct is False

    def test_whitespace_trimming(self) -> None:
        data = {"correct_answers": ["Buenos días"]}
        result = validate_answer("translation", data, " Buenos días ")
        assert result.correct is True


class TestNumberInput:
    def test_exact_integer(self) -> None:
        data = {"correct_answer": 5, "tolerance": 0}
        result = validate_answer("number_input", data, "5")
        assert result.correct is True

    def test_exact_decimal(self) -> None:
        data = {"correct_answer": 3.14, "tolerance": 0}
        result = validate_answer("number_input", data, "3.14")
        assert result.correct is True

    def test_within_tolerance(self) -> None:
        data = {"correct_answer": 3.14, "tolerance": 0.01}
        result = validate_answer("number_input", data, "3.15")
        assert result.correct is True

    def test_outside_tolerance(self) -> None:
        data = {"correct_answer": 3.14, "tolerance": 0.01}
        result = validate_answer("number_input", data, "3.2")
        assert result.correct is False

    def test_negative_numbers(self) -> None:
        data = {"correct_answer": -7, "tolerance": 0}
        result = validate_answer("number_input", data, "-7")
        assert result.correct is True

    def test_whitespace_handling(self) -> None:
        data = {"correct_answer": 42, "tolerance": 0}
        result = validate_answer("number_input", data, "  42  ")
        assert result.correct is True

    def test_invalid_input(self) -> None:
        data = {"correct_answer": 5, "tolerance": 0}
        result = validate_answer("number_input", data, "abc")
        assert result.correct is False

    def test_list_input(self) -> None:
        data = {"correct_answer": 10, "tolerance": 0}
        result = validate_answer("number_input", data, ["10"])
        assert result.correct is True

    def test_default_tolerance_zero(self) -> None:
        data = {"correct_answer": 5}
        result = validate_answer("number_input", data, "5")
        assert result.correct is True

    def test_correct_answer_in_result(self) -> None:
        data = {"correct_answer": 8, "tolerance": 0, "explanation": "5 + 3 = 8"}
        result = validate_answer("number_input", data, "8")
        assert result.correct_answer == "8"
        assert result.explanation == "5 + 3 = 8"


class TestDispatcher:
    def test_unknown_type_raises(self) -> None:
        with pytest.raises(ValueError, match="Unknown exercise type"):
            validate_answer("nonexistent_type", {}, "answer")

    def test_all_types_registered(self) -> None:
        expected_types = [
            "multiple_choice",
            "fill_blank",
            "matching",
            "listening",
            "word_arrange",
            "translation",
            "number_input",
        ]
        from src.lessons.validators import _VALIDATORS

        for t in expected_types:
            assert t in _VALIDATORS, f"Missing validator for type: {t}"

    def test_result_dataclass(self) -> None:
        r = ValidatorResult(correct=True, correct_answer="test", explanation="expl")
        assert r.correct is True
        assert r.correct_answer == "test"
        assert r.explanation == "expl"

    def test_result_default_explanation(self) -> None:
        r = ValidatorResult(correct=False, correct_answer="test")
        assert r.explanation is None
