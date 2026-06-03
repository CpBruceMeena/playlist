import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { EmptyState } from "../components/feedback/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import {
  useSavedPlaylistsStore,
  type SavedPlaylist,
} from "../stores/savedPlaylistsStore";
import { usePlayerStore } from "../stores/playerStore";
import { useToastStore } from "../stores/toastStore";

function SavedPlaylistCard({
  playlist,
  onLoad,
  onDelete,
  onRename,
}: {
  playlist: SavedPlaylist;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(playlist.name);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setEditValue(playlist.name);
    setIsEditing(true);
    // Focus on next render
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function saveEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== playlist.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }

  function cancelEdit() {
    setEditValue(playlist.name);
    setIsEditing(false);
  }

  return (
    <div className="group relative flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Thumbnail collage */}
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg">
        {playlist.videos.slice(0, 3).map((v, i) => (
          <img
            key={v.id}
            src={v.thumbnailUrl}
            alt=""
            loading="lazy"
            className={`absolute h-full w-full object-cover transition-opacity ${
              i === 0
                ? "opacity-100"
                : i === 1
                  ? "opacity-0 group-hover:opacity-100"
                  : "hidden sm:block sm:opacity-0 sm:group-hover:opacity-0"
            }`}
            style={
              i === 1
                ? { transitionDelay: "0ms" }
                : i === 2
                  ? { transitionDelay: "0ms" }
                  : undefined
            }
          />
        ))}
        <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {playlist.videoCount}
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            onBlur={saveEdit}
            autoFocus
            className="w-full rounded-md border border-blue-500/50 bg-neutral-800 px-2 py-0.5 text-sm font-semibold text-white outline-none"
          />
        ) : (
          <button
            onClick={startEditing}
            className="group/name block w-full text-left"
            title="Click to rename"
          >
            <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover/name:text-blue-400">
              {playlist.name}
              <span className="ml-1.5 inline-block text-xs text-neutral-600 opacity-0 transition-opacity group-hover/name:opacity-100">
                ✏️
              </span>
            </h3>
          </button>
        )}
        <p className="mt-0.5 text-xs text-neutral-500">
          {playlist.videoCount} video{playlist.videoCount !== 1 ? "s" : ""}
          {playlist.query ? ` · "${playlist.query}"` : ""}
        </p>
        <p className="text-[11px] text-neutral-600">
          Saved{" "}
          {new Date(playlist.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLoad}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500"
        >
          Load
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:bg-red-900/50 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function MyPlaylistsPage() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const {
    playlists,
    isLoaded,
    loadFromStorage,
    deletePlaylist,
    renamePlaylist,
  } = useSavedPlaylistsStore();

  const initQueue = usePlayerStore((s) => s.initQueue);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleLoadPlaylist = (playlist: SavedPlaylist) => {
    // Initialize the player with the saved videos
    initQueue(playlist.videos);

    // Navigate to the playlist page
    navigate("/playlist");

    addToast({
      message: `Loaded "${playlist.name}"`,
      type: "success",
      duration: 2500,
    });
  };

  const handleDeletePlaylist = (id: string, name: string) => {
    // Use a closure flag to distinguish Undo from dismiss
    let undoClicked = false;

    addToast({
      message: `Deleted "${name}"`,
      type: "info",
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          undoClicked = true;
          addToast({
            message: `Restored "${name}"`,
            type: "success",
            duration: 2000,
          });
        },
      },
    });

    // Actually delete after the toast duration (with small buffer)
    setTimeout(() => {
      if (!undoClicked) {
        deletePlaylist(id);
      }
    }, 5500);
  };

  const handleRenamePlaylist = (id: string, newName: string) => {
    const success = renamePlaylist(id, newName);
    if (success) {
      addToast({
        message: `Renamed to "${newName}"`,
        type: "success",
        duration: 2000,
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pt-24">
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header />
      <main className="animate-page-in mx-auto max-w-3xl px-4 pt-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">My Playlists</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {playlists.length > 0
              ? `You have ${playlists.length} saved playlist${playlists.length !== 1 ? "s" : ""}`
              : "Playlists you save will appear here"}
          </p>
        </div>

        {playlists.length === 0 ? (
          <EmptyState
            title="No saved playlists yet"
            message="Generate a playlist you like, then save it from the playlist page."
            suggestions={[
              {
                label: "Generate a playlist",
                onClick: () => navigate("/"),
              },
            ]}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {playlists.map((playlist) => (
              <SavedPlaylistCard
                key={playlist.id}
                playlist={playlist}
                onLoad={() => handleLoadPlaylist(playlist)}
                onDelete={() =>
                  handleDeletePlaylist(playlist.id, playlist.name)
                }
                onRename={(newName) =>
                  handleRenamePlaylist(playlist.id, newName)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
