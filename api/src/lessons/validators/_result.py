from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ValidatorResult:
    correct: bool
    correct_answer: str
    explanation: str | None = None
