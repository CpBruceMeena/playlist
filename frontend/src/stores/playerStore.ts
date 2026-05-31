import { create } from "zustand";
import type { YouTubeVideo, PlayerState, RepeatMode } from "@playlist/types";

interface PlayerStateStore {
  // Player status
  isReady: boolean;
  isPlaying: boolean;
  currentIndex: number;
  currentTime: number;
  videoDuration: number;
  volume: number;
  isMuted: boolean;

  // Queue
  queue: YouTubeVideo[];
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  playbackHistory: number[];
  originalQueue: YouTubeVideo[]; // Preserved for repeat

  // Actions
  setReady: (ready: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVideoDuration: (duration: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;

  initQueue: (videos: YouTubeVideo[]) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => YouTubeVideo | null;
  previous: () => YouTubeVideo | null;
  setCurrentIndex: (index: number) => void;

  toggleShuffle: () => void;
  toggleRepeat: () => void;

  reorderQueue: (from: number, to: number) => void;
  skipUnavailable: () => void;
  clearQueue: () => void;
}

export const usePlayerStore = create<PlayerStateStore>((set, get) => ({
  // Initial state
  isReady: false,
  isPlaying: false,
  currentIndex: -1,
  currentTime: 0,
  videoDuration: 0,
  volume: 75,
  isMuted: false,
  queue: [],
  shuffleMode: false,
  repeatMode: "none",
  playbackHistory: [],
  originalQueue: [],

  setReady: (ready) => set({ isReady: ready }),

  setPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setVideoDuration: (duration) => set({ videoDuration: duration }),

  setVolume: (vol) => set({ volume: Math.max(0, Math.min(100, vol)) }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  initQueue: (videos) =>
    set({
      queue: videos,
      originalQueue: [...videos],
      currentIndex: 0,
      isPlaying: false,
      currentTime: 0,
      videoDuration: 0,
      playbackHistory: [],
    }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  next: () => {
    const state = get();
    if (state.queue.length === 0) return null;

    const nextIndex = state.currentIndex + 1;

    if (nextIndex >= state.queue.length) {
      if (state.repeatMode === "all") {
        // Loop back to start
        set({
          currentIndex: 0,
          playbackHistory: [...state.playbackHistory, state.currentIndex],
        });
        return state.queue[0];
      }
      // Stop at end
      set({ isPlaying: false });
      return null;
    }

    set({
      currentIndex: nextIndex,
      playbackHistory: [...state.playbackHistory, state.currentIndex],
    });
    return state.queue[nextIndex];
  },

  previous: () => {
    const state = get();
    if (state.playbackHistory.length === 0) return null;

    const prevIndex = state.playbackHistory[state.playbackHistory.length - 1];
    set({
      currentIndex: prevIndex,
      playbackHistory: state.playbackHistory.slice(0, -1),
    });
    return state.queue[prevIndex];
  },

  setCurrentIndex: (index) => set({ currentIndex: index }),

  toggleShuffle: () => {
    const state = get();
    if (state.shuffleMode) {
      // Unshuffle — restore original order
      set({
        shuffleMode: false,
        queue: [...state.originalQueue],
        currentIndex: state.currentIndex < state.originalQueue.length ? state.currentIndex : 0,
      });
    } else {
      // Fisher-Yates shuffle, keeping current video at its position
      const shuffled = [...state.queue];
      const currentVideo = shuffled[state.currentIndex];

      // Remove current video from shuffle candidates
      shuffled.splice(state.currentIndex, 1);

      // Fisher-Yates on remaining
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Insert current video back at index 0
      shuffled.unshift(currentVideo);

      set({
        shuffleMode: true,
        queue: shuffled,
        originalQueue: [...state.queue],
        currentIndex: 0,
      });
    }
  },

  toggleRepeat: () =>
    set((state) => ({
      repeatMode:
        state.repeatMode === "none"
          ? "all"
          : state.repeatMode === "all"
            ? "none"
            : "none",
    })),

  reorderQueue: (from, to) =>
    set((state) => {
      const newQueue = [...state.queue];
      const [moved] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, moved);

      // Adjust current index if needed
      let newIndex = state.currentIndex;
      if (from === state.currentIndex) {
        newIndex = to;
      } else if (from < state.currentIndex && to >= state.currentIndex) {
        newIndex--;
      } else if (from > state.currentIndex && to <= state.currentIndex) {
        newIndex++;
      }

      return { queue: newQueue, currentIndex: newIndex };
    }),

  skipUnavailable: () => {
    // Skip the current video by advancing to next
    get().next();
  },

  clearQueue: () =>
    set({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      isPlaying: false,
      currentTime: 0,
      videoDuration: 0,
      playbackHistory: [],
    }),
}));
