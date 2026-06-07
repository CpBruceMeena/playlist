import { useEffect, useState, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { EmptyState } from "../components/feedback/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { PlaylistPlayerDialog } from "../components/player/PlaylistPlayerDialog";
import {
  useSavedPlaylistsStore,
  type SavedPlaylist,
} from "../stores/savedPlaylistsStore";
import { useToastStore } from "../stores/toastStore";

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

const PlaylistTile = memo(function PlaylistTile({
  playlist,
  onPlay,
  onDelete,
  onRename,
}: {
  playlist: SavedPlaylist;
  onPlay: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(playlist.name);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setEditValue(playlist.name);
    setIsEditing(true);
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

  const firstThumb = playlist.videos[0]?.thumbnailUrl;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-blue-600/20 to-purple-600/20">
        {firstThumb ? (
          <img
            src={firstThumb}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-blue-400/30"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="13" y2="13" />
              <line x1="9" y1="17" x2="11" y2="17" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Hover play overlay */}
        <div
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/90 opacity-0 shadow-lg shadow-blue-600/30 transition-all duration-200 group-hover:opacity-100 group-hover:scale-110">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        </div>

        {/* Video count badge */}
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          {playlist.videoCount}
        </div>

        {/* Delete button — always visible */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-neutral-400 backdrop-blur-sm transition-all duration-200 hover:bg-red-900/60 hover:text-red-400"
          aria-label="Delete playlist"
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
      <div className="flex flex-1 flex-col justify-between gap-1 p-2.5">
        {/* Name */}
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
            className="w-full rounded-md border border-blue-500/50 bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-white outline-none"
          />
        ) : (
          <button
            onClick={startEditing}
            className="block w-full text-left"
            title="Click to rename"
          >
            <p className="line-clamp-2 text-xs font-medium leading-tight text-neutral-200 transition-colors group-hover:text-white">
              {playlist.name}
              <span className="ml-1 inline-block text-[10px] text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100">✏️</span>
            </p>
          </button>
        )}

        {/* Query + date */}
        <div className="flex flex-wrap items-center gap-1">
          {playlist.query && (
            <span className="truncate rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 max-w-[100px]">
              {playlist.query.length > 14 ? playlist.query.slice(0, 14) + "…" : playlist.query}
            </span>
          )}
          <span className="text-[10px] text-neutral-500">
            {formatDate(playlist.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
});

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

  // Player dialog state
  const [playerDialog, setPlayerDialog] = useState<{
    videos: { id: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[];
    initialIndex: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handlePlayPlaylist = (playlist: SavedPlaylist) => {
    if (playlist.videos.length === 0) return;
    setPlayerDialog({
      videos: playlist.videos.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        durationSeconds: v.durationSeconds,
      })),
      initialIndex: 0,
      title: playlist.name,
    });
  };

  const handleDeletePlaylist = (id: string) => {
    deletePlaylist(id);
  };

  const handleRenamePlaylist = (id: string, newName: string) => {
    const success = renamePlaylist(id, newName);
    if (success) {
      addToast({ message: `Renamed to "${newName}"`, type: "success", duration: 2000 });
    }
  };

  if (!isLoaded) {
    return (
      <SidebarLayout>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        </main>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <main className="animate-page-in mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">My Playlists</h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              {playlists.length > 0
                ? `You have ${playlists.length} saved playlist${playlists.length !== 1 ? "s" : ""}`
                : "Playlists you save will appear here"}
            </p>
          </div>
        </div>

        {playlists.length === 0 ? (
          <EmptyState
            title="No saved playlists yet"
            message="Generate a playlist you like, then save it from the playlist page."
            suggestions={[
              { label: "Generate a playlist", onClick: () => navigate("/") },
            ]}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {playlists.map((playlist) => (
              <PlaylistTile
                key={playlist.id}
                playlist={playlist}
                onPlay={() => handlePlayPlaylist(playlist)}
                onDelete={() => handleDeletePlaylist(playlist.id)}
                onRename={(newName) => handleRenamePlaylist(playlist.id, newName)}
              />
            ))}
          </div>
        )}

        {/* Playlist player dialog */}
        {playerDialog && (
          <PlaylistPlayerDialog
            videos={playerDialog.videos}
            initialIndex={playerDialog.initialIndex}
            title={playerDialog.title}
            onClose={() => setPlayerDialog(null)}
          />
        )}
      </main>
    </SidebarLayout>
  );
}
