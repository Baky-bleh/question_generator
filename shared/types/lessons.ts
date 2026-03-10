export interface Lesson {
  id: string;
  title: string;
  content_url: string;
  exercise_count: number;
  estimated_minutes: number;
}

export interface ExerciseSubmitRequest {
  exercise_id: string;
  answer: string | string[];
  time_seconds: number;
}

export interface ExerciseSubmitResponse {
  correct: boolean;
  correct_answer: string;
  explanation: string | null;
  xp_earned: number;
}

// Exercise types for lesson content JSON (discriminated union)
export type ExerciseType =
  | "multiple_choice"
  | "fill_blank"
  | "matching"
  | "listening"
  | "word_arrange"
  | "translation"
  | "number_input";

interface BaseExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  difficulty: number;
}

export interface MultipleChoiceExercise extends BaseExercise {
  type: "multiple_choice";
  choices: string[];
  correct_index: number;
}

export interface FillBlankExercise extends BaseExercise {
  type: "fill_blank";
  sentence: string;
  blank_index: number;
  correct_answer: string;
  hint: string | null;
}

export interface MatchingExercise extends BaseExercise {
  type: "matching";
  pairs: Array<{ left: string; right: string }>;
}

export interface ListeningExercise extends BaseExercise {
  type: "listening";
  audio_url: string;
  correct_answer: string;
  slow_audio_url: string | null;
}

export interface WordArrangeExercise extends BaseExercise {
  type: "word_arrange";
  words: string[];
  correct_order: number[];
}

export interface TranslationExercise extends BaseExercise {
  type: "translation";
  source_language: string;
  target_language: string;
  correct_answer: string;
  accepted_answers: string[];
}

export interface NumberInputExercise extends BaseExercise {
  type: "number_input";
  correct_answer: number;
  tolerance?: number;
  unit?: string;
}

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | MatchingExercise
  | ListeningExercise
  | WordArrangeExercise
  | TranslationExercise
  | NumberInputExercise;

export interface LessonContent {
  lesson_id: string;
  title: string;
  exercises: Exercise[];
}
