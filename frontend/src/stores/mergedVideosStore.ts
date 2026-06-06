import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MergedVideo } from "@playlist/types";

export interface MergeJob {
  id: string;
  status: "processing" | "error";
  songs: { id: string; title: string }[];
  error?: string;
}

interface MergedVideosState {
  mergedVideos: MergedVideo[];
  mergeJobs: MergeJob[];

  addMergedVideo: (video: MergedVideo) => void;
  removeMergedVideo: (id: string) => void;
  setMergedVideos: (videos: MergedVideo[]) => void;

  addMergeJob: (job: MergeJob) => void;
  updateMergeJob: (id: string, updates: Partial<MergeJob>) => void;
  removeMergeJob: (id: string) => void;
}

export const useMergedVideosStore = create<MergedVideosState>()(
  persist(
    (set) => ({
      mergedVideos: [],
      mergeJobs: [],

      addMergedVideo: (video) =>
        set((state) => ({
          mergedVideos: [video, ...state.mergedVideos],
        })),

      removeMergedVideo: (id) =>
        set((state) => ({
          mergedVideos: state.mergedVideos.filter((v) => v.id !== id),
        })),

      setMergedVideos: (videos) => set({ mergedVideos: videos }),

      addMergeJob: (job) =>
        set((state) => ({
          mergeJobs: [job, ...state.mergeJobs],
        })),

      updateMergeJob: (id, updates) =>
        set((state) => ({
          mergeJobs: state.mergeJobs.map((j) =>
            j.id === id ? { ...j, ...updates } : j,
          ),
        })),

      removeMergeJob: (id) =>
        set((state) => ({
          mergeJobs: state.mergeJobs.filter((j) => j.id !== id),
        })),
    }),
    {
      name: "merged-videos",
      // Don't persist in-progress jobs (they're ephemeral)
      partialize: (state) => ({
        mergedVideos: state.mergedVideos,
        mergeJobs: [],
      }),
    },
  ),
);
