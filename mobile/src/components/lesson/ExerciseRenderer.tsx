import React from "react";
import type { Exercise } from "@lingualeap/types";
import { MultipleChoice } from "./MultipleChoice";
import { FillBlank } from "./FillBlank";
import { Matching } from "./Matching";
import { Listening } from "./Listening";
import { WordArrange } from "./WordArrange";
import { Translation } from "./Translation";
import { NumberInput } from "./NumberInput";

export interface ExerciseComponentProps {
  exercise: Exercise;
  onAnswer: (answer: string | string[]) => void;
  disabled: boolean;
}

interface ExerciseRendererProps {
  exercise: Exercise;
  onAnswer: (answer: string | string[]) => void;
  disabled: boolean;
}

export function ExerciseRenderer({ exercise, onAnswer, disabled }: ExerciseRendererProps) {
  const props: ExerciseComponentProps = { exercise, onAnswer, disabled };

  switch (exercise.type) {
    case "multiple_choice":
      return <MultipleChoice {...props} />;
    case "fill_blank":
      return <FillBlank {...props} />;
    case "matching":
      return <Matching {...props} />;
    case "listening":
      return <Listening {...props} />;
    case "word_arrange":
      return <WordArrange {...props} />;
    case "translation":
      return <Translation {...props} />;
    case "number_input":
      return <NumberInput {...props} />;
    default:
      return null;
  }
}
