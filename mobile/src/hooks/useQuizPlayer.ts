import { useState, useRef, useCallback, useEffect } from "react";
import { useSubmitAnswerMutation } from "@/hooks/queries/useSubmitAnswer";
import { useCompleteLessonMutation } from "@/hooks/queries/useCompleteLesson";
import type { Exercise, ExerciseSubmitResponse, LessonCompleteResponse } from "@lingualeap/types";

export type QuizPhase = "intro" | "exercise" | "feedback" | "results";

interface AnswerRecord {
  exerciseId: string;
  correct: boolean;
  xpEarned: number;
  correctAnswer: string;
  explanation: string | null;
}

interface UseQuizPlayerResult {
  phase: QuizPhase;
  currentIndex: number;
  currentExercise: Exercise | null;
  answers: AnswerRecord[];
  lastFeedback: ExerciseSubmitResponse | null;
  runningScore: number;
  elapsedTime: number;
  totalExercises: number;
  isSubmitting: boolean;
  completionResult: LessonCompleteResponse | null;
  startQuiz: () => void;
  submitAnswer: (answer: string | string[]) => void;
  nextExercise: () => void;
}

export function useQuizPlayer(
  quizId: string,
  courseId: string,
  exercises: Exercise[],
): UseQuizPlayerResult {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [lastFeedback, setLastFeedback] = useState<ExerciseSubmitResponse | null>(null);
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

  const startQuiz = useCallback(() => {
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

      const timeOnExercise = Math.max(
        1,
        Math.floor((Date.now() - exerciseStartRef.current) / 1000),
      );

      submitMutation.mutate(
        {
          lessonId: quizId,
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
            // No hearts penalty — Khan Academy style
            setPhase("feedback");
          },
        },
      );
    },
    [currentExercise, quizId, courseId, submitMutation],
  );

  const completeQuiz = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const correctCount =
      answers.length > 0 ? answers.filter((a) => a.correct).length : 0;
    const mistakes = answers.length - correctCount;
    const score =
      answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;
    const perfect = mistakes === 0 && answers.length > 0;

    completeMutation.mutate(
      {
        lessonId: quizId,
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
  }, [answers, elapsedTime, quizId, courseId, completeMutation]);

  const nextExercise = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= totalExercises) {
      completeQuiz();
    } else {
      setCurrentIndex(nextIdx);
      setLastFeedback(null);
      setPhase("exercise");
      exerciseStartRef.current = Date.now();
    }
  }, [currentIndex, totalExercises, completeQuiz]);

  return {
    phase,
    currentIndex,
    currentExercise,
    answers,
    lastFeedback,
    runningScore,
    elapsedTime,
    totalExercises,
    isSubmitting: submitMutation.isPending || completeMutation.isPending,
    completionResult,
    startQuiz,
    submitAnswer,
    nextExercise,
  };
}
