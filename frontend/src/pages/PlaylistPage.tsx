import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { YouTubePlayer } from "../components/player/YouTubePlayer";
import { QueueList, QueueHeader } from "../components/player/QueueList";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/feedback/EmptyState";
import { usePlaylistStore } from "../stores/playlistStore";
import { usePlayerStore } from "../stores/playerStore";
import { useSavedPlaylistsStore } from "../stores/savedPlaylistsStore";
import { useToastStore } from "../stores/toastStore";
import { useFilterStore } from "../stores/filterStore";
import { useSingerStore, hasSingerAttribution } from "../stores/singerStore";
import { useSavedSongsStore } from "../stores/savedSongsStore";
import { savePlaylistToBackend } from "../api/playlists";

export function PlaylistPage() {
  const navigate = useNavigate();
  const { videos, error } = usePlaylistStore();
  const {
    queue,
    shuffleMode,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
  } = usePlayerStore();
  const getFilterPayload = useFilterStore((s) => s.getFilterPayload);
  const query = useFilterStore((s) => s.query);
  const savePlaylist = useSavedPlaylistsStore((s) => s.savePlaylist);
  const addToast = useToastStore((s) => s.addToast);
  const singerNames = useSingerStore((s) => s.singerNames);
  const clearGenerated = useSingerStore((s) => s.clearGenerated);
  const loadSongs = useSavedSongsStore((s) => s.loadFromStorage);

  // Load saved songs from storage on mount
  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Selection state for saving/merging songs
  const [isSelecting, setIsSelecting] = useState(false);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Determine active videos from queue (not store videos, since queue can be reordered)
  const activeVideos = queue.length > 0 ? queue : videos;

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
      const filters = getFilterPayload();
      let savedToBackend = false;

      // Save to backend first (authoritative save)
      try {
        const backendResult = await savePlaylistToBackend(
          playlistName.trim(),
          query,
          filters,
          activeVideos
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
          activeVideos
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
  }, [playlistName, getFilterPayload, query, activeVideos, savePlaylist, addToast]);

  const isMultiSinger = hasSingerAttribution(queue);
  const singerCount = isMultiSinger ? Object.keys(singerNames).length : 0;

  // Show empty state if no playlist data is loaded (instead of redirecting to home)
  if (videos.length === 0 && queue.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Header />
        <main className="mx-auto max-w-5xl px-4 pt-24 text-center">
          <EmptyState
            title="No playlist loaded"
            message="Generate a playlist from the home page or load one from your saved playlists to start watching."
            suggestions={[
              { label: "Generate a playlist", onClick: () => navigate("/") },
              { label: "My Playlists", onClick: () => navigate("/my-playlists") },
            ]}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header onBack={() => {
        clearGenerated();
        navigate("/");
      }} showActions onSave={handleSave} />

      <main className="animate-page-in mx-auto max-w-6xl px-4 py-6">
        {/* Singer attribution banner */}
        {isMultiSinger && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-900/40 bg-blue-950/20 px-4 py-3">
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

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Player section */}
          <div className="flex-1">
            <YouTubePlayer />
          </div>

          {/* Queue section */}
          <div className="w-full lg:w-80">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50">
              <QueueHeader
                count={queue.length}
                shuffleMode={shuffleMode}
                repeatMode={repeatMode}
                onToggleShuffle={toggleShuffle}
                onToggleRepeat={toggleRepeat}
                isSelecting={isSelecting}
                onToggleSelect={() => setIsSelecting((prev) => !prev)}
              />

              <div className="max-h-[60vh] overflow-y-auto">
                <QueueList
                  isSelecting={isSelecting}
                  onToggleSelect={() => setIsSelecting((prev) => !prev)}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

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

    </div>
  );
}
