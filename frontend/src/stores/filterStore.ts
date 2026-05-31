import { create } from "zustand";
import type { FilterCriteria, VideoType, UploadDateRange } from "@playlist/types";

interface FilterState {
  // Filter values
  query: string;
  durationMin: number | undefined;
  durationMax: number | undefined;
  videoTypes: VideoType[];
  includeKeywords: string[];
  excludeKeywords: string[];
  uploadDate: UploadDateRange;
  minViews: number | undefined;
  maxResults: number;
  safeSearch: boolean;

  // UI state
  isExpanded: boolean;

  // Actions
  setQuery: (query: string) => void;
  setDurationMin: (seconds: number | undefined) => void;
  setDurationMax: (seconds: number | undefined) => void;
  setVideoTypes: (types: VideoType[]) => void;
  toggleVideoType: (type: VideoType) => void;
  addIncludeKeyword: (keyword: string) => void;
  removeIncludeKeyword: (keyword: string) => void;
  addExcludeKeyword: (keyword: string) => void;
  removeExcludeKeyword: (keyword: string) => void;
  setUploadDate: (range: UploadDateRange) => void;
  setMinViews: (views: number | undefined) => void;
  setMaxResults: (count: number) => void;
  setSafeSearch: (on: boolean) => void;
  resetFilters: () => void;
  togglePanel: () => void;
  getActiveFilterCount: () => number;
  getFilterPayload: () => FilterCriteria;
}

const initialFilters = {
  durationMin: undefined as number | undefined,
  durationMax: undefined as number | undefined,
  videoTypes: ["music", "live", "shorts", "standard"] as VideoType[],
  includeKeywords: [] as string[],
  excludeKeywords: [] as string[],
  uploadDate: { type: "any" } as UploadDateRange,
  minViews: undefined as number | undefined,
  maxResults: 25,
  safeSearch: true,
};

export const useFilterStore = create<FilterState>((set, get) => ({
  // State
  query: "",
  ...initialFilters,
  isExpanded: false,

  // Actions
  setQuery: (query) => set({ query }),

  setDurationMin: (seconds) => set({ durationMin: seconds }),
  setDurationMax: (seconds) => set({ durationMax: seconds }),

  setVideoTypes: (types) => set({ videoTypes: types }),

  toggleVideoType: (type) =>
    set((state) => {
      const has = state.videoTypes.includes(type);
      // Don't allow deselecting all types
      if (has && state.videoTypes.length <= 1) return state;
      return {
        videoTypes: has
          ? state.videoTypes.filter((t) => t !== type)
          : [...state.videoTypes, type],
      };
    }),

  addIncludeKeyword: (keyword) =>
    set((state) => {
      const trimmed = keyword.trim().toLowerCase();
      if (!trimmed || state.includeKeywords.includes(trimmed)) return state;
      return { includeKeywords: [...state.includeKeywords, trimmed] };
    }),

  removeIncludeKeyword: (keyword) =>
    set((state) => ({
      includeKeywords: state.includeKeywords.filter((k) => k !== keyword),
    })),

  addExcludeKeyword: (keyword) =>
    set((state) => {
      const trimmed = keyword.trim().toLowerCase();
      if (!trimmed || state.excludeKeywords.includes(trimmed)) return state;
      return { excludeKeywords: [...state.excludeKeywords, trimmed] };
    }),

  removeExcludeKeyword: (keyword) =>
    set((state) => ({
      excludeKeywords: state.excludeKeywords.filter((k) => k !== keyword),
    })),

  setUploadDate: (range) => set({ uploadDate: range }),

  setMinViews: (views) => set({ minViews: views }),
  setMaxResults: (count) => set({ maxResults: count }),
  setSafeSearch: (on) => set({ safeSearch: on }),

  resetFilters: () =>
    set({
      ...initialFilters,
      query: get().query,
      isExpanded: get().isExpanded,
    }),

  togglePanel: () => set((state) => ({ isExpanded: !state.isExpanded })),

  getActiveFilterCount: () => {
    const state = get();
    let count = 0;
    if (state.durationMin !== undefined || state.durationMax !== undefined) count++;
    if (state.videoTypes.length < 4) count++;
    if (state.includeKeywords.length > 0) count++;
    if (state.excludeKeywords.length > 0) count++;
    if (state.uploadDate.type !== "any") count++;
    if (state.minViews !== undefined) count++;
    if (state.maxResults !== 25) count++;
    if (!state.safeSearch) count++;
    return count;
  },

  getFilterPayload: () => {
    const state = get();
    return {
      query: state.query,
      durationMin: state.durationMin,
      durationMax: state.durationMax,
      videoTypes: state.videoTypes,
      includeKeywords: state.includeKeywords,
      excludeKeywords: state.excludeKeywords,
      uploadDate: state.uploadDate,
      minViews: state.minViews,
      maxResults: state.maxResults,
      safeSearch: state.safeSearch,
    };
  },
}));
