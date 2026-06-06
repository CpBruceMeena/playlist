import { create } from "zustand";
import type { YouTubeVideo, RepeatMode, MergedVideo } from "@playlist/types";

/* ─── sessionStorage persistence ─── */

const SESSION_KEY = "player-store";

interface PersistedState {
  queue: YouTubeVideo[];
  currentIndex: number;
  volume: number;
  isMuted: boolean;
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  playbackHistory: number[];
  originalQueue: YouTubeVideo[];
}

function saveToSession(state: PlayerStateStore) {
  try {
    const snapshot: PersistedState = {
      queue: state.queue,
      currentIndex: state.currentIndex,
      volume: state.volume,
      isMuted: state.isMuted,
      shuffleMode: state.shuffleMode,
      repeatMode: state.repeatMode,
      playbackHistory: state.playbackHistory,
      originalQueue: state.originalQueue,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

function restoreFromSession(): Partial<PlayerStateStore> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      ...parsed,
      // Reset transient fields — no autoplay/stale time on refresh
      isPlaying: false,
      currentTime: 0,
      videoDuration: 0,
      isReady: false,
    };
  } catch {
    return {};
  }
}

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

  // Queue version tracking — incremented on every initQueue call so React effects detect changes
  queueInitCounter: number;

  // Merged video playback
  playingMergedVideo: MergedVideo | null;
  mergedVideoCurrentTime: number;

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

  addNext: (video: YouTubeVideo) => void;
  addToQueue: (video: YouTubeVideo) => void;
  addPlaylistNext: (videos: YouTubeVideo[]) => void;
  addPlaylistToQueue: (videos: YouTubeVideo[]) => void;

  toggleShuffle: () => void;
  toggleRepeat: () => void;

  reorderQueue: (from: number, to: number) => void;
  skipUnavailable: () => void;
  clearQueue: () => void;
  setPlayingMergedVideo: (video: MergedVideo | null) => void;
  setMergedVideoCurrentTime: (time: number) => void;
}

/* ─── Debounced auto-save — persists state changes to sessionStorage ─── */

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(store: typeof usePlayerStore) {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveToSession(store.getState());
  }, 300);
}

export const usePlayerStore = create<PlayerStateStore>((set, get) => {
  // Attempt to restore session on creation
  const session = restoreFromSession();

  return {
    // Initial state — merge defaults with restored session
    isReady: false,
    isPlaying: false,
    currentIndex: session.currentIndex ?? -1,
    currentTime: 0,
    videoDuration: 0,
    volume: session.volume ?? 75,
    isMuted: session.isMuted ?? false,
    queue: session.queue ?? [],
    playingMergedVideo: null,
    mergedVideoCurrentTime: 0,
    queueInitCounter: 0,
    shuffleMode: session.shuffleMode ?? false,
    repeatMode: session.repeatMode ?? "none",
    playbackHistory: session.playbackHistory ?? [],
    originalQueue: session.originalQueue ?? [],

    // ── Actions ──

    setReady: (ready) => set({ isReady: ready }),

    setPlaying: (playing) => set({ isPlaying: playing }),

    setCurrentTime: (time) => set({ currentTime: time }),

    setVideoDuration: (duration) => set({ videoDuration: duration }),

    setVolume: (vol) => set({ volume: Math.max(0, Math.min(100, vol)) }),

    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

    initQueue: (videos) =>
      set((state) => ({
        queue: videos,
        originalQueue: [...videos],
        currentIndex: 0,
        isPlaying: true,
        currentTime: 0,
        videoDuration: 0,
        playbackHistory: [],
        playingMergedVideo: null,
        queueInitCounter: state.queueInitCounter + 1,
      })),

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

    addNext: (video) =>
      set((state) => {
        // If no YouTube video is active (e.g. merged video was playing),
        // start playing this video immediately
        if (state.currentIndex < 0) {
          return {
            queue: [video],
            originalQueue: [video],
            currentIndex: 0,
            isPlaying: true,
            currentTime: 0,
            videoDuration: 0,
            playbackHistory: [],
            playingMergedVideo: null,
          };
        }
        const insertAt = state.currentIndex + 1;
        const newQueue = [...state.queue];
        newQueue.splice(insertAt, 0, video);
        return { queue: newQueue, playingMergedVideo: null };
      }),

    addToQueue: (video) =>
      set((state) => {
        // If no YouTube video is active (e.g. merged video was playing),
        // start playing this video immediately
        if (state.currentIndex < 0) {
          return {
            queue: [video],
            originalQueue: [video],
            currentIndex: 0,
            isPlaying: true,
            currentTime: 0,
            videoDuration: 0,
            playbackHistory: [],
            playingMergedVideo: null,
          };
        }
        return {
          queue: [...state.queue, video],
          playingMergedVideo: null,
        };
      }),

    addPlaylistNext: (videos) =>
      set((state) => {
        // If no YouTube video is active, start playing immediately
        if (state.currentIndex < 0) {
          return {
            queue: videos,
            originalQueue: [...videos],
            currentIndex: 0,
            isPlaying: true,
            currentTime: 0,
            videoDuration: 0,
            playbackHistory: [],
            playingMergedVideo: null,
          };
        }
        const insertAt = state.currentIndex + 1;
        const newQueue = [...state.queue];
        newQueue.splice(insertAt, 0, ...videos);
        return { queue: newQueue, playingMergedVideo: null };
      }),

    addPlaylistToQueue: (videos) =>
      set((state) => {
        // If no YouTube video is active, start playing immediately
        if (state.currentIndex < 0) {
          return {
            queue: videos,
            originalQueue: [...videos],
            currentIndex: 0,
            isPlaying: true,
            currentTime: 0,
            videoDuration: 0,
            playbackHistory: [],
            playingMergedVideo: null,
          };
        }
        return {
          queue: [...state.queue, ...videos],
          playingMergedVideo: null,
        };
      }),

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
        playingMergedVideo: null,
      }),

    setPlayingMergedVideo: (video) =>
      set({
        playingMergedVideo: video,
        // Clear YouTube queue when playing a merged video
        queue: video ? [] : [],
        originalQueue: video ? [] : [],
        currentIndex: video ? -1 : -1,
        isPlaying: video ? true : false,
        currentTime: 0,
        videoDuration: video ? video.duration : 0,
        playbackHistory: [],
        // Reset saved time when starting a new merged video
        mergedVideoCurrentTime: video ? 0 : 0,
      }),

    setMergedVideoCurrentTime: (time) => set({ mergedVideoCurrentTime: time }),
  };
});

/* ─── Subscribe to all mutations and auto-save ─── */

usePlayerStore.subscribe((state) => {
  // Only save when there is actual content (skip empty initial state)
  if (state.queue.length > 0 && state.currentIndex >= 0) {
    scheduleSave(usePlayerStore);
  }
});
