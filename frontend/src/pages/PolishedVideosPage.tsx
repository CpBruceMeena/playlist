import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { EmptyState } from "../components/feedback/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { VideoPlayerModal } from "../components/player/VideoPlayerModal";
import { useMergedVideosStore } from "../stores/mergedVideosStore";
import {
  listRenderedVideos,
  deleteMergedVideo,
  type PolishedVideo,
} from "../api/merge";

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

// ─── Processing Tile ──────────────────────────────────────────

const ProcessingTile = memo(function ProcessingTile({
  video,
  onDelete,
}: {
  video: PolishedVideo;
  onDelete?: () => void;
}) {
  const gradeLabel = video.renderOptions?.grade || "auto";
  const qualityLabel = video.renderOptions?.quality || "final";

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-amber-900/30 bg-neutral-900/50 transition-all duration-200 hover:border-amber-500/40">
      {/* Placeholder gradient */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-600/20 to-yellow-600/20">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="h-8 w-8 animate-spin text-amber-400/60"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-[11px] font-medium text-amber-400/70">
              Processing...
            </span>
          </div>
        </div>

        {/* Polish badges */}
        <div className="absolute left-1.5 top-1.5 z-10 flex gap-1">
          <span className="rounded-md bg-amber-600/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {qualityLabel}
          </span>
          <span className="rounded-md bg-blue-600/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {gradeLabel}
          </span>
        </div>

        {/* Cancel button (stuck processing items) */}
        {onDelete && (            <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800/60 text-neutral-400 backdrop-blur-sm transition-all duration-200 hover:bg-red-600 hover:text-white"
            aria-label="Dismiss"
            title="Dismiss from list"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between gap-2 p-3">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-neutral-300">
          {video.title}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-neutral-500">
            {video.songCount} songs
          </span>
        </div>
        {/* Animated progress bar */}
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full w-1/2 animate-progress rounded-full bg-gradient-to-r from-amber-500 to-yellow-500" />
        </div>
      </div>
    </div>
  );
});

// ─── Error Tile ──────────────────────────────────────────────

const ErrorTile = memo(function ErrorTile({
  video,
  onDelete,
}: {
  video: PolishedVideo;
  onDelete: () => void;
}) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-red-900/40 bg-neutral-900/50">
      {/* Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-600/20 to-rose-600/20">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-400/50"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-red-900/60 text-red-400 backdrop-blur-sm transition-all duration-200 hover:bg-red-600 hover:text-white"
          aria-label="Dismiss failed render"
          title="Dismiss"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-red-300">
          {video.title}
        </p>
        <p className="text-[10px] text-red-400/70">
          {video.error || "Render failed"}
        </p>
      </div>
    </div>
  );
});

// ─── Completed Tile ──────────────────────────────────────────

const PolishedVideoTile = memo(function PolishedVideoTile({
  video,
  onPlay,
  onDelete,
}: {
  video: PolishedVideo;
  onPlay: () => void;
  onDelete: () => void;
}) {
  const thumbnailSrc =
    video.thumbnailUrl ||
    (video.songs[0]?.id
      ? `https://i.ytimg.com/vi/${video.songs[0].id}/hqdefault.jpg`
      : null);
  const [imgFailed, setImgFailed] = useState(false);
  const showFallback = !thumbnailSrc || imgFailed;

  const renderOpts = video.renderOptions || {};
  const gradeLabel = renderOpts.grade || "auto";
  const qualityLabel = renderOpts.quality || "final";

  return (
    <div
      onClick={onPlay}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-purple-900/30 bg-neutral-900/50 transition-all duration-200 hover:border-purple-500/50 hover:bg-neutral-900 hover:shadow-lg hover:shadow-purple-500/10"
    >
      {/* Thumbnail */}
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
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-400/40"
            >
              <path d="M12 2l2.4 7.2L22 9.2l-5.4 4.2 2 7.6-6.6-4.6-6.6 4.6 2-7.6L2 9.2l7.6-1z" />
            </svg>
          </div>
        )}

        {/* Polish badge */}
        <div className="absolute left-1.5 top-1.5 z-10 flex gap-1">
          <span className="rounded-md bg-purple-600/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {qualityLabel}
          </span>
          <span className="rounded-md bg-blue-600/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {gradeLabel}
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          {video.duration ? formatDuration(video.duration) : "0:00"}
        </div>

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/90 opacity-0 shadow-lg shadow-purple-600/30 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-red-900/50 text-red-400 backdrop-blur-sm transition-all duration-200 hover:bg-red-600 hover:text-white"
          aria-label="Delete polished video"
          title="Delete"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
            {video.songCount} songs ·{" "}
            {video.createdAt ? formatDate(video.createdAt) : ""}
          </span>
          <span className="ml-auto text-[10px] text-purple-400/70">
            YouTube ready
          </span>
        </div>
      </div>
    </div>
  );
});

// ─── Notification Banner ─────────────────────────────────────

function NotificationBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  // Use a ref so the timeout doesn't reset on every render
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismissRef.current();
    }, 6000);
    return () => clearTimeout(timer);
  }, []); // empty deps — timer starts once on mount

  return (
    <div className="mb-4 animate-in flex items-center gap-3 rounded-xl border border-emerald-800/40 bg-emerald-950/30 px-4 py-3 backdrop-blur-sm">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-emerald-400"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <span className="text-sm font-medium text-emerald-200">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-auto rounded-lg p-1 text-emerald-400/60 transition-colors hover:text-emerald-300"
        aria-label="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export function PolishedVideosPage() {
  const navigate = useNavigate();
  const { removeMergedVideo } = useMergedVideosStore();
  const [videos, setVideos] = useState<PolishedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // Seen completed IDs — used to detect new completions
  const seenCompletedIds = useRef(new Set<string>());

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // Video player modal state
  const [playerVideo, setPlayerVideo] = useState<PolishedVideo | null>(null);

  // Track currently-known completed IDs for notification detection
  const prevCompletedIds = useRef<Set<string>>(new Set());

  // Fetch rendered items — runs immediately and then polls every 3s
  const fetchRendered = useCallback(async () => {
    try {
      const items = await listRenderedVideos();
      setVideos(items);

      // Detect new completions for notification
      const completedIds = new Set(
        items
          .filter((v) => v.status === "completed")
          .map((v) => v.id),
      );

      if (prevCompletedIds.current.size > 0) {
        for (const id of completedIds) {
          if (!prevCompletedIds.current.has(id) && !seenCompletedIds.current.has(id)) {
            const video = items.find((v) => v.id === id);
            if (video) {
              seenCompletedIds.current.add(id);
              setNotification(`✨ "${video.title}" finished polishing!`);
            }
          }
        }
      }

      // On first load, mark all existing completed as seen
      if (prevCompletedIds.current.size === 0) {
        for (const id of completedIds) {
          seenCompletedIds.current.add(id);
        }
      }

      prevCompletedIds.current = completedIds;
    } catch {
      // Server unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + poll every 3 seconds
  useEffect(() => {
    fetchRendered();
    const interval = setInterval(fetchRendered, 3000);
    return () => clearInterval(interval);
  }, [fetchRendered]);

  const handlePlay = (video: PolishedVideo) => {
    setPlayerVideo(video);
  };

  const handleDelete = async (video: PolishedVideo) => {
    removeMergedVideo(video.id);
    setVideos((prev) => prev.filter((v) => v.id !== video.id));
    try {
      await deleteMergedVideo(video.id);
    } catch {
      // Backend unavailable
    }
  };

  // Separate by status
  const processingVideos = videos.filter((v) => v.status === "processing");
  const errorVideos = videos.filter((v) => v.status === "error");
  const completedVideos = videos.filter((v) => v.status === "completed");
  const hasContent = videos.length > 0;

  return (
    <SidebarLayout>
      <main className="animate-page-in mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Polished Videos</h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              {processingVideos.length > 0
                ? `${processingVideos.length} polishing... · ${completedVideos.length} ready for YouTube`
                : completedVideos.length > 0
                  ? `${completedVideos.length} video${completedVideos.length !== 1 ? "s" : ""} — ready for YouTube upload`
                  : "Polished videos will appear here"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !hasContent ? (
          <EmptyState
            title="No polished videos yet"
            message="Create a merge, then use the star icon on any merged video to polish it with fades, color grading, and loudness normalization."
            suggestions={[
              { label: "Go to Merged Videos", onClick: () => navigate("/merged-videos") },
              { label: "Generate a playlist", onClick: () => navigate("/") },
            ]}
          />
        ) : (
          <>
            {/* Notification banner */}
            {notification && (
              <NotificationBanner
                message={notification}
                onDismiss={() => setNotification(null)}
              />
            )}

            {/* In-progress renders */}
            {processingVideos.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
                  In Progress ({processingVideos.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {processingVideos.map((video) => (
                    <ProcessingTile
                      key={video.id}
                      video={video}
                      onDelete={() => handleDelete(video)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Failed renders */}
            {errorVideos.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
                  Failed ({errorVideos.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {errorVideos.map((video) => (
                    <ErrorTile
                      key={video.id}
                      video={video}
                      onDelete={() => handleDelete(video)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed polished videos */}
            {completedVideos.length > 0 && (
              <div>
                {(processingVideos.length > 0 || errorVideos.length > 0) && (
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400">
                    Ready for YouTube ({completedVideos.length})
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {completedVideos.map((video) => (
                    <PolishedVideoTile
                      key={video.id}
                      video={video}
                      onPlay={() => handlePlay(video)}
                      onDelete={() => handleDelete(video)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Video player modal */}
      {playerVideo?.videoUrl && (
        <VideoPlayerModal
          videoUrl={playerVideo.videoUrl}
          title={playerVideo.title}
          onClose={() => setPlayerVideo(null)}
        />
      )}
    </SidebarLayout>
  );
}
