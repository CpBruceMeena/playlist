import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { EmptyState } from "../components/feedback/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { useMergedVideosStore, type MergeJob } from "../stores/mergedVideosStore";
import { usePlayerStore } from "../stores/playerStore";
import { useToastStore } from "../stores/toastStore";
import { listMergedVideos } from "../api/merge";
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

const MergedVideoPlayer = memo(function MergedVideoPlayer({ video, onClose }: { video: MergedVideo; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mergedVideoCurrentTime = usePlayerStore((s) => s.mergedVideoCurrentTime);
  const setMergedVideoCurrentTime = usePlayerStore((s) => s.setMergedVideoCurrentTime);

  // Restore playback position on mount
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (mergedVideoCurrentTime > 0) {
      el.currentTime = mergedVideoCurrentTime;
    }
    el.play().catch(() => {});
  }, []); // only on mount

  // Save position on interval while playing
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      if (!el.paused) {
        setMergedVideoCurrentTime(el.currentTime);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Save position on unmount
  useEffect(() => {
    return () => {
      const el = videoRef.current;
      if (el && el.currentTime > 0) {
        setMergedVideoCurrentTime(el.currentTime);
      }
    };
  }, []);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      <div className="relative bg-black">
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full max-h-[60vh]"
          controls
          playsInline
          preload="auto"
        />
      </div>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{video.title}</h3>
          <p className="text-xs text-neutral-500">
            {video.songCount} songs · {formatDuration(video.duration)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-white"
        >
          Close
        </button>
      </div>
      <div className="border-t border-neutral-800 px-4 py-3">
        <p className="mb-2 text-xs font-medium text-neutral-500">Included songs:</p>
        <div className="flex flex-col gap-1.5">
          {video.songs.map((song, i) => (
            <div key={song.id} className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-[10px] text-blue-400">
                {i + 1}
              </span>
              <span className="truncate">{song.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const MergedVideoTile = memo(function MergedVideoTile({
  video,
  onPlay,
  onDelete,
  onAddNext,
  onAddToQueue,
  onAddToPlaylist,
}: {
  video: MergedVideo;
  onPlay: () => void;
  onDelete: () => void;
  onAddNext: () => void;
  onAddToQueue: () => void;
  onAddToPlaylist: () => void;
}) {
  const playerActive = usePlayerStore(
    (s) => (s.queue.length > 0 && s.currentIndex >= 0) || s.playingMergedVideo !== null,
  );

  return (
    <div
      onClick={onPlay}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900 hover:shadow-lg hover:shadow-blue-500/5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
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

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/90 opacity-0 shadow-lg shadow-blue-600/30 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        </div>

        {/* Delete button — top-right corner, hover reveal */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-neutral-400 opacity-0 backdrop-blur-sm transition-all duration-200 hover:bg-red-900/60 hover:text-red-400 group-hover:opacity-100"
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

        {/* Hover-reveal queue action buttons */}
        {playerActive && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 z-10">
            <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 pb-2 pt-6">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddNext(); }}
                  className="flex-1 rounded-md bg-blue-600/20 py-1 text-[10px] font-medium text-blue-300 transition-colors hover:bg-blue-600/30 hover:text-blue-200"
                >
                  Play next
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToQueue(); }}
                  className="flex-1 rounded-md bg-white/10 py-1 text-[10px] font-medium text-neutral-300 transition-colors hover:bg-white/20"
                >
                  Queue
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToPlaylist(); }}
                  className="flex items-center justify-center rounded-md bg-white/10 p-1 text-neutral-300 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label="Add to playlist"
                  title="Add to playlist"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
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
        {video.songs.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {video.songs.slice(0, 2).map((song) => (
              <span
                key={song.id}
                className="truncate rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 max-w-[80px]"
              >
                {song.title.length > 12 ? song.title.slice(0, 12) + "…" : song.title}
              </span>
            ))}
            {video.songs.length > 2 && (
              <span className="text-[10px] text-neutral-600">+{video.songs.length - 2}</span>
            )}
          </div>
        )}

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
  const playingMergedVideo = usePlayerStore((s) => s.playingMergedVideo);
  const setPlayingMergedVideo = usePlayerStore((s) => s.setPlayingMergedVideo);
  const addToast = useToastStore((s) => s.addToast);
  const [loading, setLoading] = useState(true);

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
    setPlayingMergedVideo(video);
  };

  const handleDeleteMergedVideo = (video: MergedVideo) => {
    let undoClicked = false;
    addToast({
      message: `Deleted "${video.title}"`,
      type: "info",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          undoClicked = true;
          addToast({ message: `Restored "${video.title}"`, type: "success", duration: 2000 });
        },
      },
    });
    setTimeout(() => {
      if (!undoClicked) removeMergedVideo(video.id);
    }, 5500);
  };

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

        {/* Currently playing video */}
        {playingMergedVideo && (
          <MergedVideoPlayer
            video={playingMergedVideo}
            onClose={() => setPlayingMergedVideo(null)}
          />
        )}

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
                      onAddNext={() => {
                        handlePlayMergedVideo(video);
                        addToast({ message: `Now playing "${video.title}"`, type: "info", duration: 2000 });
                      }}
                      onAddToQueue={() => {
                        handlePlayMergedVideo(video);
                        addToast({ message: `Now playing "${video.title}"`, type: "info", duration: 2000 });
                      }}
                      onAddToPlaylist={() => {
                        addToast({ message: `"${video.title}" added to playlist (coming soon)`, type: "info", duration: 2000 });
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </SidebarLayout>
  );
}
