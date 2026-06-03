import { mergeVideos } from "./merge";
import { useMergedVideosStore } from "../stores/mergedVideosStore";
import { useToastStore } from "../stores/toastStore";

interface MergeSong {
  id: string;
  title: string;
}

/**
 * Start a merge in the background. Adds a processing job to the store,
 * kicks off the API call, and updates the store + shows toasts on completion.
 *
 * The caller can optionally navigate after success.
 */
export async function startMerge(
  songs: MergeSong[],
  navigate?: (path: string) => void,
) {
  const addToast = useToastStore.getState().addToast;
  const { addMergeJob, updateMergeJob, removeMergeJob, addMergedVideo } =
    useMergedVideosStore.getState();

  const jobId = crypto.randomUUID();

  // Add processing job to store
  addMergeJob({
    id: jobId,
    status: "processing",
    songs,
  });

  addToast({
    message: `⏳ Merging ${songs.length} song${songs.length !== 1 ? "s" : ""}...`,
    type: "info",
    duration: 4000,
  });

  try {
    const mergeData = songs.map((s) => ({
      id: s.id,
      title: s.title,
      url: `https://www.youtube.com/watch?v=${s.id}`,
    }));

    const result = await mergeVideos(mergeData);

    // Store merged video, remove processing job
    addMergedVideo(result);
    removeMergeJob(jobId);

    addToast({
      message: `✅ "${result.title}" is ready!`,
      type: "success",
      duration: 6000,
      action: {
        label: "View",
        onClick: () => navigate?.("/merged-videos"),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Merge failed";
    const isServerDown =
      msg.includes("unavailable") || msg.includes("Failed to fetch");

    updateMergeJob(jobId, {
      status: "error",
      error: isServerDown
        ? "Merge server not running. Start it with: python3 scripts/merge_server.py"
        : `Merge failed: ${msg}`,
    });

    addToast({
      message: isServerDown
        ? "Merge server not running"
        : `Merge failed: ${msg}`,
      type: "error",
      duration: 6000,
    });
  }
}
