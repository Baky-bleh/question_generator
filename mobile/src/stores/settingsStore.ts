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

interface SettingsState {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticEnabled: boolean;
  hasCompletedOnboarding: boolean;
  selectedLanguageTo: string | null;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  completeOnboarding: () => void;
  setLanguage: (lang: string) => void;
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
  };
  storage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "system",
  notificationsEnabled: true,
  soundEnabled: true,
  hapticEnabled: true,
  hasCompletedOnboarding: false,
  selectedLanguageTo: null,

  setTheme: (theme) => {
    set({ theme });
    persistSettings({ ...get(), theme });
  },

  toggleNotifications: () => {
    const next = !get().notificationsEnabled;
    set({ notificationsEnabled: next });
    persistSettings({ ...get(), notificationsEnabled: next });
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    set({ soundEnabled: next });
    persistSettings({ ...get(), soundEnabled: next });
  },

  toggleHaptic: () => {
    const next = !get().hapticEnabled;
    set({ hapticEnabled: next });
    persistSettings({ ...get(), hapticEnabled: next });
  },

  completeOnboarding: () => {
    set({ hasCompletedOnboarding: true });
    persistSettings({ ...get(), hasCompletedOnboarding: true });
  },

  setLanguage: (lang) => {
    set({ selectedLanguageTo: lang });
    persistSettings({ ...get(), selectedLanguageTo: lang });
  },

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
