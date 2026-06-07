import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { EmptyState } from "../components/feedback/EmptyState";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { PlaylistPlayerDialog } from "../components/player/PlaylistPlayerDialog";
import { MergeOrderDialog } from "../components/processing/MergeOrderDialog";
import { useSavedSongsStore } from "../stores/savedSongsStore";
import { useSavedPlaylistsStore } from "../stores/savedPlaylistsStore";
import { startMerge } from "../api/mergeRunner";
import type { SavedSong } from "@playlist/types";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function songToYouTubeVideo(song: SavedSong) {
  return {
    id: song.videoId,
    title: song.title,
    channelTitle: song.channelTitle,
    thumbnailUrl: song.thumbnailUrl,
    duration: song.duration,
    durationSeconds: song.durationSeconds,
    singerName: song.singerName,
    singerId: song.singerId,
    description: "",
    channelId: "",
    viewCount: 0,
    likeCount: 0,
    publishedAt: song.savedAt,
    tags: [] as string[],
    videoType: "music" as const,
  };
}

interface SingerGroup {
  singerName: string;
  songs: SavedSong[];
}

function groupBySinger(songs: SavedSong[]): {
  groups: SingerGroup[];
  ungrouped: SavedSong[];
} {
  const groupsMap = new Map<string, SavedSong[]>();
  const ungrouped: SavedSong[] = [];

  for (const song of songs) {
    if (song.singerName) {
      const existing = groupsMap.get(song.singerName) ?? [];
      existing.push(song);
      groupsMap.set(song.singerName, existing);
    } else {
      ungrouped.push(song);
    }
  }

  const groups = Array.from(groupsMap.entries())
    .map(([singerName, songs]) => ({ singerName, songs }))
    .sort((a, b) => b.songs.length - a.songs.length);

  return { groups, ungrouped };
}

function getUniqueSingers(songs: SavedSong[]): string[] {
  const singers = new Set<string>();
  for (const song of songs) {
    if (song.singerName) singers.add(song.singerName);
  }
  return Array.from(singers).sort();
}

const SongTile = memo(function SongTile({
  song,
  isSelectable,
  isSelected,
  onToggleSelect,
  onPlay,
  onRemove,
}: {
  song: SavedSong;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-neutral-900/50 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Thumbnail - click anywhere to toggle selection in select mode */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-neutral-800"
        onClick={() => {
          if (isSelectable) {
            onToggleSelect?.();
          }
        }}
      >
        <img
          src={song.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          {formatDuration(song.durationSeconds)}
        </div>

        {/* Hover play button — click to play (select mode: let click through to thumbnail) */}
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

        {/* Remove button — always visible */}
        {!isSelectable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-neutral-400 backdrop-blur-sm transition-colors hover:bg-red-500/80 hover:text-white"
            aria-label={`Remove ${song.title}`}
            title="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div
        className="flex flex-1 flex-col justify-between gap-1.5 p-3 cursor-pointer"
        onClick={() => {
          if (isSelectable) {
            onToggleSelect?.();
          } else {
            onPlay();
          }
        }}
      >
        <p className="line-clamp-2 text-xs font-medium leading-tight text-neutral-200 group-hover:text-white">
          {song.title}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {song.singerName ? (
            <span className="truncate rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              {song.singerName}
            </span>
          ) : (
            <span className="truncate text-[10px] text-neutral-500">
              {song.channelTitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export function MySongsPage() {
  const navigate = useNavigate();
  const { songs, isLoaded, loadFromStorage, removeSong, clearAll } =
    useSavedSongsStore();

  const [singerFilter, setSingerFilter] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Player dialog state
  const [playerDialog, setPlayerDialog] = useState<{
    videos: { id: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[];
    initialIndex: number;
    title: string;
  } | null>(null);

  // Order dialogs
  const [showSaveOrderDialog, setShowSaveOrderDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const savePlaylistToStore = useSavedPlaylistsStore((s) => s.savePlaylist);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Reset filter when songs change (e.g., after delete)
  useEffect(() => {
    if (singerFilter && !songs.some((s) => s.singerName === singerFilter)) {
      setSingerFilter(null);
    }
  }, [songs, singerFilter]);

  const filteredSongs = useMemo(() => {
    if (!singerFilter) return songs;
    return songs.filter((s) => s.singerName === singerFilter);
  }, [songs, singerFilter]);

  const allSingers = useMemo(() => getUniqueSingers(songs), [songs]);
  const { groups, ungrouped } = useMemo(
    () => groupBySinger(filteredSongs),
    [filteredSongs],
  );

  const selectedSongs = useMemo(
    () => {
      const songMap = new Map(songs.map((s) => [s.videoId, s]));
      return selectedIds
        .map((id) => songMap.get(id))
        .filter((s): s is SavedSong => s !== undefined);
    },
    [songs, selectedIds],
  );

  const toggleSelect = useCallback((videoId: string) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(videoId);
      if (idx !== -1) {
        return prev.filter((id) => id !== videoId);
      }
      return [...prev, videoId];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(filteredSongs.map((s) => s.videoId));
  }, [filteredSongs]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // ── Save as Playlist ──

  const doSavePlaylist = useCallback(
    (videos: ReturnType<typeof songToYouTubeVideo>[], name: string) => {
      const result = savePlaylistToStore(
        name,
        "",
        {
          query: "",
          videoTypes: ["music"],
          includeKeywords: [],
          excludeKeywords: [],
          uploadDate: { type: "any" },
          maxResults: 50,
          safeSearch: true,
        },
        videos,
      );

      if ("error" in result) {
        return false;
      }

      setIsSelecting(false);
      setSelectedIds([]);
      return true;
    },
    [savePlaylistToStore, navigate],
  );



  // Save with reorder dialog
  const handleSaveAsPlaylist = useCallback(() => {
    setShowSaveOrderDialog(true);
  }, []);

  const handleSaveOrderConfirm = useCallback(
    (ordered: { id: string; videoId: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[], playlistName: string) => {
      setShowSaveOrderDialog(false);

      const videoMap = new Map(selectedSongs.map((s) => [s.videoId, s]));
      const orderedVideos = ordered
        .map((o) => videoMap.get(o.videoId))
        .filter((s): s is SavedSong => s !== undefined)
        .map(songToYouTubeVideo);

      if (orderedVideos.length === 0) {
        return;
      }

      const name = playlistName.trim() || `Playlist (${orderedVideos.length} songs)`;
      doSavePlaylist(orderedVideos, name);
    },
    [selectedSongs, doSavePlaylist],
  );

  // ── Merge ──

  const doMerge = useCallback(
    (songsToMerge: SavedSong[], mergeName?: string) => {
      startMerge(
        songsToMerge.map((s) => ({ id: s.videoId, title: s.title, thumbnailUrl: s.thumbnailUrl })),
        navigate,
        mergeName,
      );
      setIsSelecting(false);
      setSelectedIds([]);
    },
    [navigate],
  );



  // Merge with reorder dialog
  const handleMergeSelected = useCallback(() => {
    if (selectedSongs.length < 2) {
      return;
    }
    setShowMergeDialog(true);
  }, [selectedSongs]);

  const handleMergeDialogConfirm = useCallback(
    (ordered: { id: string; videoId: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[], mergeName: string) => {
      setShowMergeDialog(false);

      const videoMap = new Map(selectedSongs.map((s) => [s.videoId, s]));
      const orderedSongs = ordered
        .map((o) => videoMap.get(o.videoId))
        .filter((s): s is SavedSong => s !== undefined);

      if (orderedSongs.length < 2) {
        return;
      }

      doMerge(orderedSongs, mergeName);
    },
    [selectedSongs, doMerge],
  );

  const handleMergeDialogRemove = useCallback(
    (song: { id: string }) => {
      removeSong(song.id);
    },
    [removeSong],
  );

  const handlePlaySong = (song: SavedSong) => {
    setPlayerDialog({
      videos: [{
        id: song.videoId,
        title: song.title,
        thumbnailUrl: song.thumbnailUrl,
        durationSeconds: song.durationSeconds,
      }],
      initialIndex: 0,
      title: song.title,
    });
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
      <main className="animate-page-in mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header row */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">My Songs</h1>
            <p className="mt-0.5 text-xs text-neutral-500">
              {isSelecting
                ? `${selectedIds.length} of ${filteredSongs.length} selected`
                : songs.length > 0
                  ? `${songs.length} song${songs.length !== 1 ? "s" : ""} · ${allSingers.length} singer${allSingers.length !== 1 ? "s" : ""}`
                  : "Songs you save will appear here"}
            </p>
          </div>
          {songs.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              {isSelecting ? (
                <>
                  <button
                    onClick={selectedIds.length === filteredSongs.length ? deselectAll : selectAll}
                    className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                  >
                    {selectedIds.length === filteredSongs.length ? "Deselect all" : "Select all"}
                  </button>
                  {selectedIds.length > 0 && (
                    <>
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
                <>
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
                  <Button variant="ghost" size="sm" onClick={() => clearAll()}>
                    Clear All
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Singer filter chips */}
        {allSingers.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSingerFilter(null)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                singerFilter === null
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              }`}
            >
              All
            </button>
            {allSingers.map((name) => {
              const count = songs.filter((s) => s.singerName === name).length;
              return (
                <button
                  key={name}
                  onClick={() => setSingerFilter(name === singerFilter ? null : name)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-all ${
                    singerFilter === name
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                  }`}
                >
                  {name}
                  <span className="ml-0.5 opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {songs.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No saved songs yet"
              message="Generate a playlist, select songs you like, and save them here."
              suggestions={[
                { label: "Generate a playlist", onClick: () => navigate("/") },
              ]}
            />
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title={`No songs from "${singerFilter}"`}
              message="No songs match this filter. Try selecting a different singer."
              variant="inline"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Singer-grouped sections */}
            {groups.map(({ singerName, songs: singerSongs }) => (
              <section key={singerName}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/15">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-white">{singerName}</h2>
                    <span className="text-xs text-neutral-500">{singerSongs.length}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {singerSongs.map((song) => (
                    <SongTile
                      key={song.id}
                      song={song}
                      isSelectable={isSelecting}
                      isSelected={selectedIds.includes(song.videoId)}
                      onToggleSelect={() => toggleSelect(song.videoId)}
                      onPlay={() => {
                        if (!isSelecting) handlePlaySong(song);
                      }}
                      onRemove={() => {
                        if (isSelecting) return;
                        removeSong(song.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}

            {/* Ungrouped songs (no singer attribution) */}
            {ungrouped.length > 0 && (
              <section>
                {groups.length > 0 && (
                  <div className="mb-3 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                    <h2 className="text-sm font-semibold text-neutral-400">Other Songs</h2>
                    <span className="text-xs text-neutral-600">{ungrouped.length}</span>
                  </div>
                )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {ungrouped.map((song) => (
                    <SongTile
                      key={song.id}
                      song={song}
                      isSelectable={isSelecting}
                      isSelected={selectedIds.includes(song.videoId)}
                      onToggleSelect={() => toggleSelect(song.videoId)}
                      onPlay={() => {
                        if (!isSelecting) handlePlaySong(song);
                      }}
                      onRemove={() => {
                        if (isSelecting) return;
                        removeSong(song.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Save as Playlist order dialog */}
      {showSaveOrderDialog && (
        <MergeOrderDialog
          mode="playlist"
          songs={selectedSongs.map((s) => ({
            id: s.id,
            videoId: s.videoId,
            title: s.title,
            thumbnailUrl: s.thumbnailUrl,
            duration: s.duration,
            durationSeconds: s.durationSeconds,
          }))}
          onConfirm={handleSaveOrderConfirm}
          onRemove={handleMergeDialogRemove}
          onClose={() => setShowSaveOrderDialog(false)}
        />
      )}

      {/* Merge order dialog */}
      {showMergeDialog && (
        <MergeOrderDialog
          songs={selectedSongs.map((s) => ({
            id: s.id,
            videoId: s.videoId,
            title: s.title,
            thumbnailUrl: s.thumbnailUrl,
            duration: s.duration,
            durationSeconds: s.durationSeconds,
          }))}
          onConfirm={handleMergeDialogConfirm}
          onRemove={handleMergeDialogRemove}
          onClose={() => setShowMergeDialog(false)}
        />
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

    </SidebarLayout>
  );
}
