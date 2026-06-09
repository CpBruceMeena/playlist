import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DownloadItem } from "@playlist/types";

export interface DownloadJob {
  id: string;
  url: string;
  status: "processing" | "error" | "completed";
  error?: string;
}

interface DownloadsState {
  downloads: DownloadItem[];
  jobs: DownloadJob[];

  addDownload: (item: DownloadItem) => void;
  removeDownload: (id: string) => void;
  setDownloads: (items: DownloadItem[]) => void;

  addJob: (job: DownloadJob) => void;
  updateJob: (id: string, updates: Partial<DownloadJob>) => void;
  removeJob: (id: string) => void;
}

export const useDownloadsStore = create<DownloadsState>()(
  persist(
    (set) => ({
      downloads: [],
      jobs: [],

      addDownload: (item) =>
        set((state) => ({
          downloads: [item, ...state.downloads],
        })),

      removeDownload: (id) =>
        set((state) => ({
          downloads: state.downloads.filter((d) => d.id !== id),
        })),

      setDownloads: (items) => set({ downloads: items }),

      addJob: (job) =>
        set((state) => ({
          jobs: [job, ...state.jobs],
        })),

      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        })),

      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
        })),
    }),
    {
      name: "downloads",
      partialize: (state) => ({
        downloads: state.downloads,
        jobs: [],
      }),
    },
  ),
);
