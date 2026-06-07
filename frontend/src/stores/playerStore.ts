import { create } from "zustand";

/* ─── sessionStorage persistence ─── */

const SESSION_KEY = "player-store";

interface PersistedState {
  volume: number;
  isMuted: boolean;
}

function savePreferences(state: PlayerPreferenceStore) {
  try {
    const snapshot: PersistedState = {
      volume: state.volume,
      isMuted: state.isMuted,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

function restorePreferences(): Partial<PlayerPreferenceStore> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      volume: parsed.volume,
      isMuted: parsed.isMuted,
    };
  } catch {
    return {};
  }
}

interface PlayerPreferenceStore {
  volume: number;
  isMuted: boolean;

  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

export const usePlayerStore = create<PlayerPreferenceStore>((set) => {
  const prefs = restorePreferences();

  return {
    volume: prefs.volume ?? 75,
    isMuted: prefs.isMuted ?? false,

    setVolume: (vol) => set({ volume: Math.max(0, Math.min(100, vol)) }),
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  };
});

/* ─── Subscribe to preference changes and auto-save ─── */

let saveTimer: ReturnType<typeof setTimeout> | null = null;

usePlayerStore.subscribe(() => {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    savePreferences(usePlayerStore.getState());
  }, 300);
});
