import { useState, useEffect, useCallback } from "react";
import { SidebarLayout } from "../components/layout/Sidebar";
import { EmptyState } from "../components/feedback/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { VideoPlayerModal } from "../components/player/VideoPlayerModal";
import { useDownloadsStore, type DownloadJob } from "../stores/downloadsStore";
import { startDownload, listDownloads, deleteDownload } from "../api/downloads";
import type { DownloadItem } from "@playlist/types";

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

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

const DownloadTile = ({
  item,
  onPlay,
  onDelete,
}: {
  item: DownloadItem;
  onPlay: () => void;
  onDelete: () => void;
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showFallback = !item.thumbnailUrl || imgFailed;

  return (
    <div
      onClick={onPlay}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all duration-200 hover:border-white/10 hover:bg-neutral-900 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
        {!showFallback ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-white/10"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          {formatDuration(item.duration)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-neutral-400 backdrop-blur-sm transition-all duration-200 hover:bg-red-500/80 hover:text-white"
          aria-label="Delete download"
          title="Delete"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-1.5 p-3">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-neutral-200 group-hover:text-white">
          {item.title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-neutral-500">
            {formatDate(item.createdAt)}
          </span>
          <span className="text-[10px] text-neutral-500">
            {formatFileSize(item.fileSize)}
          </span>
        </div>
      </div>
    </div>
  );
};

const DownloadJobCard = ({ job }: { job: DownloadJob }) => {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5">
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
              className="text-red-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white">
            {job.status === "processing" ? "Downloading..." : "Download failed"}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-400">
            {job.status === "processing"
              ? "Fetching video..."
              : job.error}
          </p>
        </div>
      </div>
    </div>
  );
};

export function DownloadsPage() {
  const { downloads, jobs, setDownloads, removeDownload } = useDownloadsStore();
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [playerVideo, setPlayerVideo] = useState<DownloadItem | null>(null);
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function fetchDownloads() {
      try {
        const items = await listDownloads();
        if (items.length > 0) {
          setDownloads(items);
        }
      } catch {
        // Fall back to local store if server is unavailable
      } finally {
        setLoading(false);
      }
    }
    fetchDownloads();
  }, [setDownloads]);

  const handleDownload = useCallback(
    async (urls: string[]) => {
      setError(null);
      for (const url of urls) {
        const trimmed = url.trim();
        if (!trimmed) continue;

        const jobId = crypto.randomUUID();
        useDownloadsStore.getState().addJob({
          id: jobId,
          url: trimmed,
          status: "processing",
        });

        setDownloading(true);
        try {
          const result = await startDownload(trimmed);
          useDownloadsStore.getState().removeJob(jobId);
          useDownloadsStore.getState().addDownload(result);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Download failed";
          useDownloadsStore.getState().updateJob(jobId, {
            status: "error",
            error: msg,
          });
          setError(msg);
        } finally {
          setDownloading(false);
        }
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloading) return;

    const urls = urlInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;

    setPendingUrls(urls);
    setShowConfirm(true);
  };

  const handleConfirmDownload = async () => {
    setShowConfirm(false);
    const urls = pendingUrls;
    setUrlInput("");
    setDownloading(true);
    try {
      await handleDownload(urls);
    } finally {
      setDownloading(false);
      setPendingUrls([]);
    }
  };

  const handleDelete = async (item: DownloadItem) => {
    removeDownload(item.id);
    try {
      await deleteDownload(item.id);
    } catch {
      // Local delete is sufficient for now
    }
  };

  const hasContent = downloads.length > 0 || jobs.length > 0;

  return (
    <SidebarLayout>
      <main className="animate-page-in mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Downloads</h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              {jobs.length > 0
                ? `${jobs.length} download${jobs.length !== 1 ? "s" : ""} in progress`
                : downloads.length > 0
                  ? `${downloads.length} video${downloads.length !== 1 ? "s" : ""}`
                  : "Downloaded videos will appear here"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* In-progress downloads */}
            {jobs.length > 0 && (
              <div className="mb-6 flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">In Progress</h2>
                {jobs.map((job) => (
                  <DownloadJobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!hasContent && (
              <div className="mt-12">
                <EmptyState
                  title="No downloads yet"
                  message="Paste a YouTube, TikTok, or Instagram URL below to download it directly to your library."
                />
              </div>
            )}

            {/* URL input form */}
            <form onSubmit={handleSubmit} className="mb-8">
              {error && (
                <div className="mb-3 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2.5 text-xs text-red-300">
                  {error}
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="ml-3 text-red-400 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={
                  downloading
                    ? "Downloading..."
                    : "Paste one or more URLs here\n\nFormat:\n- One URL per line, OR\n- Comma-separated URLs\n\nExample:\nhttps://youtube.com/watch?v=..., https://tiktok.com/@user/video/..."
                }
                disabled={downloading}
                rows={5}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 outline-none transition-all focus:border-white/20 focus:bg-neutral-900 disabled:opacity-50"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-neutral-500">
                  Supported: YouTube, TikTok, Instagram — separate URLs with newlines or commas
                </p>
                <button
                  type="submit"
                  disabled={downloading || urlInput.trim().length === 0}
                  className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {downloading ? (
                    <>
                      <Spinner size="sm" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Completed downloads grid */}
            {downloads.length > 0 && (
              <div>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Completed</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {downloads.map((item) => (
                    <DownloadTile
                      key={item.id}
                      item={item}
                      onPlay={() => setPlayerVideo(item)}
                      onDelete={() => handleDelete(item)}
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
          videoUrl={playerVideo.downloadUrl}
          title={playerVideo.title}
          onClose={() => setPlayerVideo(null)}
        />
      )}

      {/* Download confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onKeyDown={(e) => e.key === "Escape" && setShowConfirm(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in">
            <h2 className="mb-1 text-lg font-semibold text-white">Start download?</h2>
            <p className="mb-4 text-sm text-neutral-400">
              {pendingUrls.length} URL{pendingUrls.length !== 1 ? "s" : ""} will be downloaded to the server.
              You can then download individual files to your computer from the Downloads page.
            </p>
            <div className="mb-5 max-h-40 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
              <ul className="space-y-1 text-xs text-neutral-300">
                {pendingUrls.map((url, idx) => (
                  <li key={idx} className="truncate">
                    <span className="mr-2 text-neutral-500">{idx + 1}.</span>
                    <span className="break-all">{url}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-neutral-200 active:scale-95"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
