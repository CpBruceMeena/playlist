import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/feedback/EmptyState";
import { PlaylistPlayerDialog } from "../components/player/PlaylistPlayerDialog";
import { usePlaylistStore } from "../stores/playlistStore";
import { useSavedPlaylistsStore } from "../stores/savedPlaylistsStore";
import { useToastStore } from "../stores/toastStore";
import { useFilterStore } from "../stores/filterStore";
import { useSingerStore, hasSingerAttribution } from "../stores/singerStore";
import { savePlaylistToBackend } from "../api/playlists";
import type { YouTubeVideo } from "@playlist/types";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoTile({ video, onPlay }: { video: YouTubeVideo; onPlay: () => void }) {
  return (
    <div
      onClick={onPlay}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900 hover:shadow-lg hover:shadow-blue-500/5"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-800">
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/90 opacity-0 shadow-lg shadow-blue-600/30 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
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

export function PlaylistPage() {
  const navigate = useNavigate();
  const { videos, error } = usePlaylistStore();
  const query = useFilterStore((s) => s.query);
  const savePlaylist = useSavedPlaylistsStore((s) => s.savePlaylist);
  const addToast = useToastStore((s) => s.addToast);
  const singerNames = useSingerStore((s) => s.singerNames);
  const clearGenerated = useSingerStore((s) => s.clearGenerated);

  // Player dialog state
  const [playerDialog, setPlayerDialog] = useState<{
    videos: { id: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[];
    initialIndex: number;
    title: string;
  } | null>(null);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      let savedToBackend = false;

      // Save to backend first (authoritative save)
      try {
        const backendResult = await savePlaylistToBackend(
          playlistName.trim(),
          query,
          filters,
          activeYouTubeVideos
        );
        savedToBackend = true;
        addToast({
          message: `Saved "${backendResult.name}" (${backendResult.videoCount} videos)`,
          type: "success",
          duration: 3000,
        });
      } catch (backendErr) {
        const backendMsg =
          backendErr instanceof Error ? backendErr.message : "Backend save failed";

        // Check for duplicate from backend
        if (backendMsg.includes("already exists")) {
          setSaveError(backendMsg);
          addToast({ message: backendMsg, type: "error", duration: 4000 });
          setSaving(false);
          return;
        }

        // Backend save failed — will fall back to localStorage below
        const isNetworkError = backendMsg.includes("Failed to fetch") || backendMsg.includes("NetworkError") || backendMsg.includes("Network request failed");
        addToast({
          message: isNetworkError ? "Server not running — saved to browser storage" : "Backend save failed, saving locally",
          type: "warning",
          duration: 4000,
        });
      }

      // Only save locally as offline backup if backend save didn't happen
      if (!savedToBackend) {
        const localResult = savePlaylist(
          playlistName.trim(),
          query,
          filters,
          activeYouTubeVideos
        );

        if (typeof localResult === "object" && localResult !== null && "error" in localResult) {
          setSaveError(localResult.error as string);
          addToast({ message: localResult.error as string, type: "error", duration: 4000 });
          setSaving(false);
          return;
        }
      }

      setShowSaveDialog(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save playlist";
      setSaveError(msg);
      addToast({ message: msg, type: "error", duration: 4000 });
    } finally {
      setSaving(false);
    }
  }, [playlistName, query, activeVideos, savePlaylist, addToast]);

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
          <button
            onClick={() => {
              clearGenerated();
              navigate("/");
            }}
            className="mr-1 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-all duration-200 hover:bg-white/5 hover:text-white"
            aria-label="Go back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>
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

        {/* Video grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {videos.map((video) => (
            <VideoTile
              key={video.id}
              video={video}
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

      {/* Save playlist dialog */}
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

    </SidebarLayout>
  );
}
