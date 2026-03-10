import { create } from "zustand";
import type { StreakInfo } from "@lingualeap/types";

interface ProgressState {
  currentCourseId: string | null;
  dailyXP: number;
  dailyGoal: number;
  streak: { current: number; longest: number; todayCompleted: boolean } | null;
  setCurrentCourse: (courseId: string) => void;
  addXP: (amount: number) => void;
  setStreak: (streak: StreakInfo) => void;
  setDailyGoal: (goal: number) => void;
  resetDaily: () => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  currentCourseId: null,
  dailyXP: 0,
  dailyGoal: 10,
  streak: null,

  setCurrentCourse: (courseId) => set({ currentCourseId: courseId }),

  addXP: (amount) => set((state) => ({ dailyXP: state.dailyXP + amount })),

  setStreak: (streak) =>
    set({
      streak: {
        current: streak.current,
        longest: streak.longest,
        todayCompleted: streak.today_completed,
      },
    }),

  setDailyGoal: (goal) => set({ dailyGoal: goal }),

  resetDaily: () => set({ dailyXP: 0 }),
}));
