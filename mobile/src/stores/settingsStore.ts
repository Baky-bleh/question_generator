import { create } from "zustand";

const SETTINGS_KEY = "lingualeap_settings";

// Safe storage wrapper — falls back to in-memory when native module is unavailable
const mem: Record<string, string> = {};
const storage = {
  getItem: async (k: string): Promise<string | null> => {
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      return await AsyncStorage.getItem(k);
    } catch {
      return mem[k] ?? null;
    }
  },
  setItem: async (k: string, v: string): Promise<void> => {
    try {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(k, v);
    } catch {
      mem[k] = v;
    }
  },
};

type MathGoal = "fundamentals" | "sat" | "olympiad" | "class";
type MathLevel = string;

interface SettingsState {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  hasCompletedOnboarding: boolean;
  selectedLanguageTo: string | null;
  mathGoal: MathGoal | null;
  mathLevel: MathLevel | null;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  completeOnboarding: () => void;
  setLanguage: (lang: string) => void;
  setMathGoal: (goal: MathGoal) => void;
  setMathLevel: (level: MathLevel) => void;
  hydrate: () => Promise<void>;
}

function persistSettings(state: Partial<SettingsState>) {
  const toSave = {
    theme: state.theme,
    notificationsEnabled: state.notificationsEnabled,
    soundEnabled: state.soundEnabled,
    hapticEnabled: state.hapticEnabled,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    selectedLanguageTo: state.selectedLanguageTo,
    mathGoal: state.mathGoal,
    mathLevel: state.mathLevel,
  };
  storage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
}

/** Set partial state and persist only if a value actually changed. */
function updateAndPersist(
  set: (partial: Partial<SettingsState>) => void,
  get: () => SettingsState,
  partial: Partial<SettingsState>,
) {
  const current = get();
  const changed = Object.entries(partial).some(
    ([k, v]) => current[k as keyof SettingsState] !== v,
  );
  if (!changed) return;
  set(partial);
  persistSettings({ ...get(), ...partial });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "system",
  notificationsEnabled: true,
  soundEnabled: true,
  hapticEnabled: true,
  hasCompletedOnboarding: false,
  selectedLanguageTo: null,
  mathGoal: null,
  mathLevel: null,

  setTheme: (theme) => updateAndPersist(set, get, { theme }),

  toggleNotifications: () => {
    updateAndPersist(set, get, { notificationsEnabled: !get().notificationsEnabled });
  },

  toggleSound: () => {
    updateAndPersist(set, get, { soundEnabled: !get().soundEnabled });
  },

  toggleHaptic: () => {
    updateAndPersist(set, get, { hapticEnabled: !get().hapticEnabled });
  },

  completeOnboarding: () => updateAndPersist(set, get, { hasCompletedOnboarding: true }),

  setLanguage: (lang) => updateAndPersist(set, get, { selectedLanguageTo: lang }),

  setMathGoal: (goal) => updateAndPersist(set, get, { mathGoal: goal }),

  setMathLevel: (level) => updateAndPersist(set, get, { mathLevel: level }),

  hydrate: async () => {
    try {
      const raw = await storage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set(parsed);
      }
    } catch {
      // Use defaults if hydration fails
    }
  },
}));
