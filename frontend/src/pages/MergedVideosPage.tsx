import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { EmptyState } from "../components/feedback/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";
import { useMergedVideosStore, type MergeJob } from "../stores/mergedVideosStore";
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

function MergedVideoPlayer({ video, onClose }: { video: MergedVideo; onClose: () => void }) {
  // Use the relative URL — Vite proxies /api to the Go backend
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      {/* Video element */}
      <div className="relative bg-black">
        <video
          src={video.videoUrl}
          className="w-full max-h-[60vh]"
          controls
          playsInline
          preload="metadata"
        />
      </div>

      {/* Info bar */}
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

      {/* Song list */}
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
}

function MergedVideoCard({
  video,
  onPlay,
}: {
  video: MergedVideo;
  onPlay: () => void;
}) {
  return (
    <div
      onClick={onPlay}
      className="group cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900"
    >
      <div className="flex items-start gap-4">
        {/* Video thumbnail placeholder */}
        <div className="relative flex h-20 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-400"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/90 opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="8,5 8,19 19,12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-white">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-neutral-500">
            {video.songCount} songs · {formatDuration(video.duration)}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-600">
            Created {formatDate(video.createdAt)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {video.songs.slice(0, 3).map((song) => (
              <span
                key={song.id}
                className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400"
              >
                {song.title.length > 20
                  ? song.title.slice(0, 20) + "…"
                  : song.title}
              </span>
            ))}
            {video.songs.length > 3 && (
              <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-500">
                +{video.songs.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Play arrow */}
        <div className="shrink-0 self-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-600 transition-colors group-hover:text-blue-400"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MergeJobCard({ job }: { job: MergeJob }) {
  return (
    <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4">
      <div className="flex items-start gap-4">
        {/* Animated icon */}
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

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-blue-200">
            {job.status === "processing"
              ? "Merging songs..."
              : "Merge failed"}
          </h3>
          <p className="mt-0.5 text-xs text-blue-300/70">
            {job.status === "processing"
              ? `${job.songs.length} song${job.songs.length !== 1 ? "s" : ""} being merged`
              : job.error}
          </p>

          {/* Progress bar */}
          {job.status === "processing" && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-950">
              <div className="h-full w-1/2 animate-progress rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            </div>
          )}

          {/* Song list */}
          <div className="mt-2 flex flex-wrap gap-1">
            {job.songs.slice(0, 3).map((song) => (
              <span
                key={song.id}
                className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300"
              >
                {song.title.length > 25
                  ? song.title.slice(0, 25) + "…"
                  : song.title}
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
}

export function MergedVideosPage() {
  const navigate = useNavigate();
  const { mergedVideos, mergeJobs, setMergedVideos } = useMergedVideosStore();
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<MergedVideo | null>(null);

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

  const hasContent = mergedVideos.length > 0 || mergeJobs.length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header />
      <main className="animate-page-in mx-auto max-w-3xl px-4 pt-20">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Merged Videos</h1>
            <p className="mt-1 text-sm text-neutral-400">
              {mergeJobs.length > 0
                ? `${mergeJobs.length} merge${mergeJobs.length !== 1 ? "s" : ""} in progress`
                : mergedVideos.length > 0
                  ? `${mergedVideos.length} merged video${mergedVideos.length !== 1 ? "s" : ""}`
                  : "Merged videos will appear here"}
            </p>
          </div>
        </div>

        {/* Currently playing video */}
        {playingVideo && (
          <MergedVideoPlayer
            video={playingVideo}
            onClose={() => setPlayingVideo(null)}
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
              {
                label: "Go to My Songs",
                onClick: () => navigate("/my-songs"),
              },
              {
                label: "Generate a playlist",
                onClick: () => navigate("/"),
              },
            ]}
          />
        ) : (
          <>
            {/* In-progress merges */}
            {mergeJobs.length > 0 && (
              <div className="mb-6 flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  In Progress
                </h2>
                {mergeJobs.map((job) => (
                  <MergeJobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {/* Completed merges */}
            {mergedVideos.length > 0 && (
              <div className="flex flex-col gap-3">
                {mergeJobs.length > 0 && (
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Completed
                  </h2>
                )}
                {mergedVideos.map((video) => (
                  <MergedVideoCard
                    key={video.id}
                    video={video}
                    onPlay={() => setPlayingVideo(video)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
