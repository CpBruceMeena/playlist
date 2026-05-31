import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { YouTubePlayer } from "../components/player/YouTubePlayer";
import { QueueList, QueueHeader } from "../components/player/QueueList";
import { EmptyState } from "../components/feedback/EmptyState";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { usePlaylistStore } from "../stores/playlistStore";
import { usePlayerStore } from "../stores/playerStore";
import { useSavedPlaylistsStore } from "../stores/savedPlaylistsStore";
import { useToastStore } from "../stores/toastStore";
import { useFilterStore } from "../stores/filterStore";

export function PlaylistPage() {
  const navigate = useNavigate();
  const { videos, error } = usePlaylistStore();
  const {
    queue,
    currentIndex,
    shuffleMode,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
  } = usePlayerStore();
  const getFilterPayload = useFilterStore((s) => s.getFilterPayload);
  const query = useFilterStore((s) => s.query);
  const savePlaylist = useSavedPlaylistsStore((s) => s.savePlaylist);
  const addToast = useToastStore((s) => s.addToast);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Determine active videos from queue (not store videos, since queue can be reordered)
  const activeVideos = queue.length > 0 ? queue : videos;

  const handleSave = useCallback(() => {
    setPlaylistName("My Playlist");
    setSaveError(null);
    setShowSaveDialog(true);
  }, []);

  const handleConfirmSave = useCallback(() => {
    if (!playlistName.trim()) {
      setSaveError("Please enter a name");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const filters = getFilterPayload();
      const result = savePlaylist(
        playlistName.trim(),
        query,
        filters,
        activeVideos
      );

      if ("error" in result) {
        setSaveError(result.error);
        addToast({ message: result.error, type: "error", duration: 4000 });
      } else {
        addToast({
          message: `Saved "${playlistName.trim()}"`,
          type: "success",
          duration: 3000,
        });
        setShowSaveDialog(false);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to save playlist";
      setSaveError(msg);
      addToast({ message: msg, type: "error", duration: 4000 });
    } finally {
      setSaving(false);
    }
  }, [playlistName, getFilterPayload, query, activeVideos, savePlaylist, addToast]);

  // If no videos, show empty state
  if (videos.length === 0 && queue.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pt-24">
          <EmptyState
            title="No playlist loaded"
            message="Go back to the home page and generate a playlist to get started."
            suggestions={[
              {
                label: "Generate a playlist",
                onClick: () => navigate("/"),
              },
            ]}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header showActions onSave={handleSave} />

      <main className="mx-auto max-w-6xl px-4 py-6">
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
              />

              <div className="max-h-[60vh] overflow-y-auto">
                <QueueList />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Save dialog */}
      {showSaveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onKeyDown={(e) => e.key === "Escape" && setShowSaveDialog(false)}
        >
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
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
