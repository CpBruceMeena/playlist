import { mergeVideos } from "./merge";
import { useMergedVideosStore } from "../stores/mergedVideosStore";

interface MergeSong {
  id: string;
  title: string;
  thumbnailUrl?: string;
}

/**
 * Start a merge in the background. Adds a processing job to the store,
 * kicks off the API call, and updates the store + shows toasts on completion.
 *
 * The caller can optionally navigate after success.
 */
export async function startMerge(
  songs: MergeSong[],
  _navigate?: (path: string) => void,
  mergeName?: string,
) {
  const { addMergeJob, updateMergeJob, removeMergeJob, addMergedVideo } =
    useMergedVideosStore.getState();

  const jobId = crypto.randomUUID();

  // Add processing job to store
  addMergeJob({
    id: jobId,
    status: "processing",
    songs,
  });

  try {
    const mergeData = songs.map((s) => ({
      id: s.id,
      title: s.title,
      url: `https://www.youtube.com/watch?v=${s.id}`,
      thumbnailUrl: s.thumbnailUrl,
    }));

    const result = await mergeVideos(mergeData, mergeName);

    // Store merged video, remove processing job
    addMergedVideo(result);
    removeMergeJob(jobId);
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
  }
}
