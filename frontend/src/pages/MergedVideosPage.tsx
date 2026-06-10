import { useState, useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { EmptyState } from "../components/feedback/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { VideoPlayerModal } from "../components/player/VideoPlayerModal";
import { useMergedVideosStore, type MergeJob } from "../stores/mergedVideosStore";
import { listMergedVideos, deleteMergedVideo } from "../api/merge";
import { startDownload } from "../api/downloads";
import { triggerBrowserDownload } from "../api/browserDownload";
import type { MergedVideo } from "@playlist/types";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const MergedVideoTile = memo(function MergedVideoTile({
  video,
  onPlay,
  onDelete,
  onDownload,
}: {
  video: MergedVideo;
  onPlay: () => void;
  onDelete: () => void;
  onDownload?: () => void;
}) {
  const thumbnailSrc = video.thumbnailUrl ||
    (video.songs[0]?.id ? `https://i.ytimg.com/vi/${video.songs[0].id}/hqdefault.jpg` : null);
  const [imgFailed, setImgFailed] = useState(false);
  const showFallback = !thumbnailSrc || imgFailed;

  return (
    <div
      onClick={onPlay}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900 hover:shadow-lg hover:shadow-blue-500/5"
    >
      {/* Thumbnail — first song's thumbnail as fallback */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
        {!showFallback ? (
          <img
            src={thumbnailSrc}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-400/40"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          {formatDuration(video.duration)}
        </div>

        {/* Download button — visible on hover */}
        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="absolute bottom-1.5 left-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-black/80 text-neutral-300 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white"
            aria-label={`Download ${video.title}`}
            title="Download"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/90 opacity-0 shadow-lg shadow-blue-600/30 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        </div>

        {/* Delete button — always visible */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-red-900/50 text-red-400 backdrop-blur-sm transition-all duration-200 hover:bg-red-600 hover:text-white"
          aria-label="Delete merged video"
          title="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between gap-1.5 p-3">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-neutral-200 group-hover:text-white">
          {video.title}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-neutral-500">
            {video.songCount} songs · {formatDate(video.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
});

const MergeJobCard = memo(function MergeJobCard({ job }: { job: MergeJob }) {
  return (
    <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
          {job.status === "processing" ? (
            <Spinner size="md" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-blue-200">
            {job.status === "processing" ? "Merging songs..." : "Merge failed"}
          </h3>
          <p className="mt-0.5 text-xs text-blue-300/70">
            {job.status === "processing"
              ? `${job.songs.length} song${job.songs.length !== 1 ? "s" : ""} being merged`
              : job.error}
          </p>
          {job.status === "processing" && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-950">
              <div className="h-full w-1/2 animate-progress rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {job.songs.slice(0, 3).map((song) => (
              <span
                key={song.id}
                className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300"
              >
                {song.title.length > 20 ? song.title.slice(0, 20) + "…" : song.title}
              </span>
            ))}
            {job.songs.length > 3 && (
              <span className="rounded-full bg-blue-950 px-2 py-0.5 text-[10px] text-blue-400">
                +{job.songs.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export function MergedVideosPage() {
  const navigate = useNavigate();
  const { mergedVideos, mergeJobs, setMergedVideos, removeMergedVideo } = useMergedVideosStore();
  const [loading, setLoading] = useState(true);

  // Video player modal state
  const [playerVideo, setPlayerVideo] = useState<MergedVideo | null>(null);

  useEffect(() => {
    async function fetchMergedVideos() {
      try {
        const videos = await listMergedVideos();
        if (videos.length > 0) {
          setMergedVideos(videos);
        }
      } catch {
        // Fall back to local store if server is unavailable
      } finally {
        setLoading(false);
      }
    }
    fetchMergedVideos();
  }, [setMergedVideos]);

  const handlePlayMergedVideo = (video: MergedVideo) => {
    setPlayerVideo(video);
  };

  const handleDeleteMergedVideo = async (video: MergedVideo) => {
    // Delete from local store immediately
    removeMergedVideo(video.id);
    // Delete from backend so it doesn't reappear on refresh
    try {
      await deleteMergedVideo(video.id);
    } catch {
      // Backend might be unavailable — local delete is sufficient for now
    }
  };

  // Download confirmation state
  const [downloadVideo, setDownloadVideo] = useState<MergedVideo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadMergedVideo = useCallback((video: MergedVideo) => {
    setDownloadVideo(video);
    setDownloadError(null);
  }, []);

  const handleDownloadConfirm = useCallback(async () => {
    if (!downloadVideo) return;
    const firstSongId = downloadVideo.songs[0]?.id;
    if (!firstSongId) return;
    const url = `https://www.youtube.com/watch?v=${firstSongId}`;
    setDownloading(true);
    try {
      const result = await startDownload(url);
      if (result?.downloadUrl) {
        triggerBrowserDownload(result.downloadUrl);
      }
      setDownloadVideo(null);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }, [downloadVideo]);

  const hasContent = mergedVideos.length > 0 || mergeJobs.length > 0;

  return (
    <SidebarLayout>
      <main className="animate-page-in mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Merged Videos</h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              {mergeJobs.length > 0
                ? `${mergeJobs.length} merge${mergeJobs.length !== 1 ? "s" : ""} in progress`
                : mergedVideos.length > 0
                  ? `${mergedVideos.length} merged video${mergedVideos.length !== 1 ? "s" : ""}`
                  : "Merged videos will appear here"}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !hasContent ? (
          <EmptyState
            title="No merged videos yet"
            message="Select songs from your queue or My Songs and merge them into a single video."
            suggestions={[
              { label: "Go to My Songs", onClick: () => navigate("/my-songs") },
              { label: "Generate a playlist", onClick: () => navigate("/") },
            ]}
          />
        ) : (
          <>
            {/* In-progress merges */}
            {mergeJobs.length > 0 && (
              <div className="mb-6 flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">In Progress</h2>
                {mergeJobs.map((job) => (
                  <MergeJobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {/* Completed merges grid */}
            {mergedVideos.length > 0 && (
              <div>
                {mergeJobs.length > 0 && (
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Completed</h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {mergedVideos.map((video) => (
                    <MergedVideoTile
                      key={video.id}
                      video={video}
                      onPlay={() => handlePlayMergedVideo(video)}
                      onDelete={() => handleDeleteMergedVideo(video)}
                      onDownload={() => handleDownloadMergedVideo(video)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Video player modal */}
      {playerVideo && (
        <VideoPlayerModal
          videoUrl={playerVideo.videoUrl}
          title={playerVideo.title}
          onClose={() => setPlayerVideo(null)}
        />
      )}

      {/* Download confirmation dialog */}
      {downloadVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onKeyDown={(e) => e.key === "Escape" && setDownloadVideo(null)}>
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in">
            <h2 className="mb-1 text-lg font-semibold text-white">Download this merged video?</h2>
            <p className="mb-4 text-sm text-neutral-400">
              "{downloadVideo.title}" will be downloaded to the server. You can then save it to your computer from the Downloads page.
            </p>
            {downloadError && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2.5 text-xs text-red-300">
                {downloadError}
                <button type="button" onClick={() => setDownloadError(null)} className="ml-3 text-red-400 underline">
                  Dismiss
                </button>
              </div>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDownloadVideo(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadConfirm}
                disabled={downloading}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-95 disabled:opacity-40"
              >
                {downloading ? "Downloading..." : "Download"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
