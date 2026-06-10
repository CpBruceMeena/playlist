import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/feedback/EmptyState";
import { PlaylistPlayerDialog } from "../components/player/PlaylistPlayerDialog";
import { MergeOrderDialog } from "../components/processing/MergeOrderDialog";
import { usePlaylistStore } from "../stores/playlistStore";
import { useSavedSongsStore } from "../stores/savedSongsStore";
import { useSavedPlaylistsStore } from "../stores/savedPlaylistsStore";
import { useFilterStore } from "../stores/filterStore";
import { useSingerStore, hasSingerAttribution } from "../stores/singerStore";
import { startDownload } from "../api/downloads";
import { triggerBrowserDownload } from "../api/browserDownload";
import { savePlaylistToBackend } from "../api/playlists";
import { startMerge } from "../api/mergeRunner";
import type { YouTubeVideo, FilterCriteria } from "@playlist/types";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoTile({
  video,
  onPlay,
  isSelectable,
  isSelected,
  onToggleSelect,
  onDownload,
}: {
  video: YouTubeVideo;
  onPlay: () => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onDownload?: () => void;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Thumbnail */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-neutral-800"
        onClick={() => {
          if (isSelectable) {
            onToggleSelect?.();
          }
        }}
      >
        <img
          src={video.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          {formatDuration(video.durationSeconds)}
        </div>

        {/* Download button — visible on hover */}
        {onDownload && !isSelectable && (
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

        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-all duration-200 hover:bg-black/30"
          onClick={(e) => {
            if (!isSelectable) {
              e.stopPropagation();
              onPlay();
            }
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/90 opacity-0 shadow-lg shadow-blue-600/30 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        </div>

        {/* Selection checkbox */}
        {isSelectable && (
          <div className="absolute left-2 top-2 z-10">
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect?.();
              }}
              className={`flex h-5 w-5 items-center justify-center rounded border transition-all duration-150 ${
                isSelected
                  ? "border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-500/30"
                  : "border-white/60 bg-black/40 text-transparent hover:border-blue-400 hover:bg-blue-500/20"
              }`}
              aria-label={isSelected ? "Deselect" : "Select"}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
          </div>
        )}
      </div>
      <div
        className="flex flex-col gap-1 p-3 cursor-pointer"
        onClick={() => {
          if (isSelectable) {
            onToggleSelect?.();
          } else {
            onPlay();
          }
        }}
      >
        <p className="line-clamp-2 text-xs font-medium leading-tight text-neutral-200 group-hover:text-white">
          {video.title}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {video.singerName ? (
            <span className="truncate rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              {video.singerName}
            </span>
          ) : (
            <span className="truncate text-[10px] text-neutral-500">
              {video.channelTitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const EMPTY_FILTERS: FilterCriteria = {
  query: "",
  videoTypes: ["music"],
  includeKeywords: [],
  excludeKeywords: [],
  uploadDate: { type: "any" },
  maxResults: 50,
  safeSearch: true,
};

export function PlaylistPage() {
  const navigate = useNavigate();
  const { videos, error } = usePlaylistStore();
  const query = useFilterStore((s) => s.query);
  const savePlaylist = useSavedPlaylistsStore((s) => s.savePlaylist);
  const addSongsToMySongs = useSavedSongsStore((s) => s.addSongs);
  const singerNames = useSingerStore((s) => s.singerNames);
  const clearGenerated = useSingerStore((s) => s.clearGenerated);

  // Player dialog state
  const [playerDialog, setPlayerDialog] = useState<{
    videos: { id: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[];
    initialIndex: number;
    title: string;
  } | null>(null);

  // Save dialog state (save entire playlist)
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Selection state ──
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Order dialogs
  const [showSaveOrderDialog, setShowSaveOrderDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const toggleSelect = useCallback((videoId: string) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(videoId);
      if (idx !== -1) return prev.filter((id) => id !== videoId);
      return [...prev, videoId];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(videos.map((v) => v.id));
  }, [videos]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedVideos = useMemo(
    () => videos.filter((v) => selectedIds.includes(v.id)),
    [videos, selectedIds],
  );

  const activeVideos = videos;

  // Convert YouTubeVideo to the format expected by save
  const activeYouTubeVideos = activeVideos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    channelId: v.channelId,
    channelTitle: v.channelTitle,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    durationSeconds: v.durationSeconds,
    singerName: v.singerName,
    singerId: v.singerId,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    publishedAt: v.publishedAt,
    tags: v.tags,
    videoType: v.videoType as "music" | "live" | "shorts" | "standard",
  }));

  // ── Save entire playlist (existing) ──

  const handleSave = useCallback(() => {
    const q = useFilterStore.getState().query;
    setPlaylistName(q || "My Playlist");
    setSaveError(null);
    setShowSaveDialog(true);
  }, []);

  const handleConfirmSave = useCallback(async () => {
    if (!playlistName.trim()) {
      setSaveError("Please enter a name");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const filters = useFilterStore.getState().getFilterPayload();

      // Save to backend first (authoritative save)
      try {
        await savePlaylistToBackend(
          playlistName.trim(),
          query,
          filters,
          activeYouTubeVideos
        );
      } catch (backendErr) {
        const backendMsg =
          backendErr instanceof Error ? backendErr.message : "Backend save failed";

        // Check for duplicate from backend
        if (backendMsg.includes("already exists")) {
          setSaveError(backendMsg);
          setSaving(false);
          return;
        }
      }

      // Save locally
      const localResult = savePlaylist(
        playlistName.trim(),
        query,
        filters,
        activeYouTubeVideos
      );

      if (typeof localResult === "object" && localResult !== null && "error" in localResult) {
        setSaveError(localResult.error as string);
        setSaving(false);
        return;
      }

      setShowSaveDialog(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save playlist";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [playlistName, query, activeVideos, savePlaylist]);

  // ── Add selected to My Songs ──

  const handleAddToMySongs = useCallback(() => {
    if (selectedVideos.length === 0) return;
    const result = addSongsToMySongs(selectedVideos);
    if ("error" in result) {
      return;
    }
    setIsSelecting(false);
    setSelectedIds([]);
  },    [selectedVideos, addSongsToMySongs]);

  // ── Save selected as Playlist ──

  const doSavePlaylist = useCallback(
    (name: string, videosToSave: YouTubeVideo[]) => {
      const result = savePlaylist(name, "", EMPTY_FILTERS, videosToSave);

      if ("error" in result) {
        return false;
      }

      setIsSelecting(false);
      setSelectedIds([]);
      return true;
    },
    [savePlaylist, navigate],
  );



  const handleSaveAsPlaylist = useCallback(() => {
    setShowSaveOrderDialog(true);
  }, []);

  const handleSaveOrderConfirm = useCallback(
    (ordered: { id: string; videoId: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[], playlistName: string) => {
      setShowSaveOrderDialog(false);
      const videoMap = new Map(selectedVideos.map((v) => [v.id, v]));
      const orderedVideos = ordered
        .map((o) => videoMap.get(o.videoId))
        .filter((v): v is YouTubeVideo => v !== undefined);

      if (orderedVideos.length === 0) {
        return;
      }

      const name = playlistName.trim() || `Playlist (${orderedVideos.length} songs)`;
      doSavePlaylist(name, orderedVideos);
    },
    [selectedVideos, doSavePlaylist],
  );  // ── Merge selected ──

  const handleMergeSelected = useCallback(() => {
    if (selectedVideos.length < 2) {
      return;
    }
    setShowMergeDialog(true);
  }, [selectedVideos]);

  const handleMergeDialogConfirm = useCallback(
    (ordered: { id: string; videoId: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[], mergeName: string) => {
      setShowMergeDialog(false);
      const videoMap = new Map(selectedVideos.map((v) => [v.id, v]));
      const orderedVideos = ordered
        .map((o) => videoMap.get(o.videoId))
        .filter((v): v is YouTubeVideo => v !== undefined);

      if (orderedVideos.length < 2) {
        return;
      }

      startMerge(
        orderedVideos.map((v) => ({ id: v.id, title: v.title, thumbnailUrl: v.thumbnailUrl })),
        navigate,
        mergeName,
      );
      setIsSelecting(false);
      setSelectedIds([]);
    },
    [selectedVideos, navigate],
  );

  // ── Download ──
  const [downloadVideo, setDownloadVideo] = useState<YouTubeVideo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = useCallback((video: YouTubeVideo) => {
    setDownloadVideo(video);
    setDownloadError(null);
  }, []);

  const handleDownloadConfirm = useCallback(async () => {
    if (!downloadVideo) return;
    const url = `https://www.youtube.com/watch?v=${downloadVideo.id}`;
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

  const isMultiSinger = hasSingerAttribution(videos as unknown as { singerName?: string }[]);
  const singerCount = isMultiSinger ? Object.keys(singerNames).length : 0;

  // Show empty state if no playlist data is loaded
  if (videos.length === 0 && !error) {
    return (
      <SidebarLayout>
        <main className="mx-auto max-w-5xl px-4 pt-6 text-center">
          <EmptyState
            title="No playlist loaded"
            message="Generate a playlist from the home page or load one from your saved playlists to start watching."
            suggestions={[
              { label: "Generate a playlist", onClick: () => navigate("/") },
              { label: "My Playlists", onClick: () => navigate("/my-playlists") },
            ]}
          />
        </main>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout
      actions={
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearGenerated();
              navigate("/");
            }}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            }
            aria-label="Go back"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            }
          >
            Save
          </Button>
        </div>
      }
    >
      <main className="animate-page-in mx-auto max-w-7xl px-4 py-6">
        {/* Singer attribution banner */}
        {isMultiSinger && (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-blue-900/40 bg-blue-950/20 px-4 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span className="text-xs font-medium text-blue-300">
              Combined from {singerCount} singer{singerCount !== 1 ? "s" : ""}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(singerNames).map(([id, name]) => (
                <span
                  key={id}
                  className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-medium text-blue-300"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Selection header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
            {isSelecting && (
              <span className="ml-2 text-blue-400">
                · {selectedIds.length} selected
              </span>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {isSelecting ? (
              <>
                <button
                  onClick={selectedIds.length === videos.length ? deselectAll : selectAll}
                  className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                >
                  {selectedIds.length === videos.length ? "Deselect all" : "Select all"}
                </button>
                {selectedIds.length > 0 && (
                  <>
                    <Button variant="secondary" size="sm" onClick={handleAddToMySongs}>
                      Add to My Songs
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleSaveAsPlaylist}>
                      Save as Playlist
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleMergeSelected}>
                      Merge ({selectedIds.length})
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsSelecting(false);
                    setSelectedIds([]);
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSelecting(true)}
                icon={
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                }
              >
                Select
              </Button>
            )}
          </div>
        </div>

        {/* Video grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {videos.map((video) => (
            <VideoTile
              key={video.id}
              video={video}
              isSelectable={isSelecting}
              isSelected={selectedIds.includes(video.id)}
              onToggleSelect={() => toggleSelect(video.id)}
              onPlay={() => {
                const index = videos.findIndex((v) => v.id === video.id);
                if (index === -1) return;
                setPlayerDialog({
                  videos: videos.map((v) => ({
                    id: v.id,
                    title: v.title,
                    thumbnailUrl: v.thumbnailUrl,
                    durationSeconds: v.durationSeconds,
                  })),
                  initialIndex: index,
                  title: query || "Playlist",
                });
              }}
              onDownload={() => handleDownload(video)}
            />
          ))}
        </div>
      </main>

      {/* Playlist player dialog */}
      {playerDialog && (
        <PlaylistPlayerDialog
          videos={playerDialog.videos}
          initialIndex={playerDialog.initialIndex}
          title={playerDialog.title}
          onClose={() => setPlayerDialog(null)}
        />
      )}

      {/* Save playlist dialog (save entire playlist) */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onKeyDown={(e) => e.key === "Escape" && setShowSaveDialog(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in">
            <h2 className="mb-1 text-lg font-semibold text-white">
              Save Playlist
            </h2>
            <p className="mb-5 text-sm text-neutral-400">
              {activeVideos.length} video{activeVideos.length !== 1 ? "s" : ""}{" "}
              will be saved to your browser.
            </p>

            <Input
              value={playlistName}
              onChange={(e) => {
                setPlaylistName(e.target.value);
                setSaveError(null);
              }}
              placeholder="My Playlist"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmSave();
                if (e.key === "Escape") setShowSaveDialog(false);
              }}
              autoFocus
            />

            {saveError && (
              <p className="mt-2 text-xs text-red-400">{saveError}</p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <Button onClick={handleConfirmSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" /> Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Playlist order dialog */}
      {showSaveOrderDialog && (
        <MergeOrderDialog
          mode="playlist"
          songs={selectedVideos.map((v) => ({
            id: v.id,
            videoId: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            duration: formatDuration(v.durationSeconds),
            durationSeconds: v.durationSeconds,
          }))}
          onConfirm={handleSaveOrderConfirm}
          onClose={() => setShowSaveOrderDialog(false)}
        />
      )}

      {/* Merge order dialog */}
      {showMergeDialog && (
        <MergeOrderDialog
          songs={selectedVideos.map((v) => ({
            id: v.id,
            videoId: v.id,
            title: v.title,
            thumbnailUrl: v.thumbnailUrl,
            duration: formatDuration(v.durationSeconds),
            durationSeconds: v.durationSeconds,
          }))}
          onConfirm={handleMergeDialogConfirm}
          onClose={() => setShowMergeDialog(false)}
        />
      )}

      {/* Download confirmation dialog */}
      {downloadVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onKeyDown={(e) => e.key === "Escape" && setDownloadVideo(null)}>
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in">
            <h2 className="mb-1 text-lg font-semibold text-white">Download this video?</h2>
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
