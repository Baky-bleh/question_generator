import { useState, useRef, useCallback, useEffect } from "react";
import { useSubmitAnswerMutation } from "@/hooks/queries/useSubmitAnswer";
import { useCompleteLessonMutation } from "@/hooks/queries/useCompleteLesson";
import type { Exercise, ExerciseSubmitResponse, LessonCompleteResponse } from "@lingualeap/types";

export type LessonPhase = "intro" | "exercise" | "feedback" | "results";

interface AnswerRecord {
  exerciseId: string;
  correct: boolean;
  xpEarned: number;
  correctAnswer: string;
  explanation: string | null;
}

interface UseLessonPlayerResult {
  phase: LessonPhase;
  currentIndex: number;
  currentExercise: Exercise | null;
  answers: AnswerRecord[];
  lastFeedback: ExerciseSubmitResponse | null;
  runningScore: number;
  heartsCount: number;
  elapsedTime: number;
  totalExercises: number;
  isSubmitting: boolean;
  completionResult: LessonCompleteResponse | null;
  startLesson: () => void;
  submitAnswer: (answer: string | string[]) => void;
  nextExercise: () => void;
}

const MAX_HEARTS = 5;

export function useLessonPlayer(
  lessonId: string,
  courseId: string,
  exercises: Exercise[],
): UseLessonPlayerResult {
  const [phase, setPhase] = useState<LessonPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lastFeedback, setLastFeedback] = useState<ExerciseSubmitResponse | null>(null);
  const [heartsCount, setHeartsCount] = useState(MAX_HEARTS);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completionResult, setCompletionResult] = useState<LessonCompleteResponse | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseStartRef = useRef(0);

  const submitMutation = useSubmitAnswerMutation();
  const completeMutation = useCompleteLessonMutation();

  const totalExercises = exercises.length;
  const currentExercise = exercises[currentIndex] ?? null;

  const runningScore =
    answers.length > 0
      ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100)
      : 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startLesson = useCallback(() => {
    setPhase("exercise");
    setElapsedTime(0);
    exerciseStartRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - exerciseStartRef.current) / 1000));
    }, 1000);
  }, []);

  const submitAnswer = useCallback(
    (answer: string | string[]) => {
      if (!currentExercise) return;

      const timeOnExercise = Math.max(1, Math.floor((Date.now() - exerciseStartRef.current) / 1000));

      submitMutation.mutate(
        {
          lessonId,
          courseId,
          body: {
            exercise_id: currentExercise.id,
            answer,
            time_seconds: timeOnExercise,
          },
        },
        {
          onSuccess: (result) => {
            setLastFeedback(result);
            setAnswers((prev) => [
              ...prev,
              {
                exerciseId: currentExercise.id,
                correct: result.correct,
                xpEarned: result.xp_earned,
                correctAnswer: result.correct_answer,
                explanation: result.explanation,
              },
            ]);
            if (!result.correct) {
              setHeartsCount((prev) => Math.max(0, prev - 1));
            }
            setPhase("feedback");
          },
        },
      );
    },
    [currentExercise, lessonId, courseId, submitMutation],
  );

  const completeLesson = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const correctCount = answers.length > 0
      ? answers.filter((a) => a.correct).length
      : 0;
    const mistakes = answers.length - correctCount;
    const score = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    const perfect = mistakes === 0 && answers.length > 0;

    completeMutation.mutate(
      {
        lessonId,
        courseId,
        body: {
          score,
          time_seconds: Math.max(1, elapsedTime),
          mistakes,
          perfect,
        },
      },
      {
        onSuccess: (result) => {
          setCompletionResult(result);
          setPhase("results");
        },
      },
    );
  }, [answers, elapsedTime, lessonId, courseId, completeMutation]);

  const nextExercise = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= totalExercises) {
      completeLesson();
    } else {
      setCurrentIndex(nextIdx);
      setLastFeedback(null);
      setPhase("exercise");
      exerciseStartRef.current = Date.now();
    }
  }, [currentIndex, totalExercises, completeLesson]);

  return {
    phase,
    currentIndex,
    currentExercise,
    answers,
    lastFeedback,
    runningScore,
    heartsCount,
    elapsedTime,
    totalExercises,
    isSubmitting: submitMutation.isPending || completeMutation.isPending,
    completionResult,
    startLesson,
    submitAnswer,
    nextExercise,
  };
}
