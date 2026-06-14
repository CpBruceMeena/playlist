import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { EmptyState } from "../components/feedback/EmptyState";
import { FilterPanel } from "../components/search/FilterPanel";
import { PlaylistPlayerDialog } from "../components/player/PlaylistPlayerDialog";
import { MergeOrderDialog } from "../components/processing/MergeOrderDialog";
import { useTVSeriesStore } from "../stores/tvSeriesStore";
import { useFilterStore } from "../stores/filterStore";
import { useSavedEpisodesStore, type SavedEpisode } from "../stores/savedEpisodesStore";
import { useSavedPlaylistsStore } from "../stores/savedPlaylistsStore";
import { startDownload } from "../api/downloads";
import { triggerBrowserDownload } from "../api/browserDownload";
import { startMerge } from "../api/mergeRunner";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface EpisodeTileProps {
  episode: SavedEpisode;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onPlay: () => void;
  onRemove: () => void;
  onDownload?: () => void;
}

const EpisodeTile = memo(function EpisodeTile({
  episode,
  isSelectable,
  isSelected,
  onToggleSelect,
  onPlay,
  onRemove,
  onDownload,
}: EpisodeTileProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-neutral-900/50 transition-all duration-200 hover:border-blue-500/40 hover:bg-neutral-900 hover:shadow-lg hover:shadow-blue-500/5">
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
          src={episode.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Download button — visible on hover */}
        {onDownload && !isSelectable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="absolute bottom-1.5 left-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-black/80 text-neutral-300 backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white"
            aria-label={`Download ${episode.title}`}
            title="Download"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Duration badge */}
        <div className="absolute bottom-1.5 right-1.5 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
          {formatDuration(episode.durationSeconds)}
        </div>

        {/* Hover play button */}
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

        {/* Remove button — always visible when not selecting */}
        {!isSelectable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-neutral-400 backdrop-blur-sm transition-colors hover:bg-red-500/80 hover:text-white"
            aria-label={`Remove ${episode.title}`}
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
          {episode.title}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          <span className="truncate text-[10px] text-neutral-500">
            {episode.channelTitle}
          </span>
        </div>
      </div>
    </div>
  );
});

const EMPTY_FILTERS = {
  query: "",
  videoTypes: ["music"],
  includeKeywords: [] as string[],
  excludeKeywords: [] as string[],
  uploadDate: { type: "any" as const },
  maxResults: 50,
  safeSearch: true,
};

export function TVSeriesPage() {
  const navigate = useNavigate();
  const {
    series,
    savedSeries,
    isLoaded,
    isLoading,
    selectedSeriesId,
    selectedSeriesName,
    isGenerating,
    generationError,
    loadSavedSeries,
    loadSeries,
    toggleSave,
    selectSeries,
    clearSelection,
    clearError,
    generate,
  } = useTVSeriesStore();

  const savedEpisodes = useSavedEpisodesStore((s) => s.episodes);
  const episodesLoaded = useSavedEpisodesStore((s) => s.isLoaded);
  const loadEpisodes = useSavedEpisodesStore((s) => s.loadFromStorage);
  const removeEpisode = useSavedEpisodesStore((s) => s.removeEpisode);
  const savePlaylistToStore = useSavedPlaylistsStore((s) => s.savePlaylist);

  useEffect(() => {
    loadSeries();
    loadSavedSeries();
    loadEpisodes();
  }, [loadSeries, loadSavedSeries, loadEpisodes]);

  // Build a list of full series objects that match saved series
  const savedSeriesList = useMemo(() => {
    return savedSeries
      .map((s) => series.find((sv) => sv.id === s.seriesId))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
      .sort((a, b) => b.popularityScore - a.popularityScore);
  }, [savedSeries, series]);

  function handleGenerate() {
    if (isGenerating) return;
    clearError();
    const filters = useFilterStore.getState().getFilterPayload();
    generate(filters).then(() => {
      navigate("/playlist");
    });
  }

  const hasSelection = selectedSeriesId !== null;
  const hasSaved = savedSeriesList.length > 0;

  // ── Selection state (episodes) ──
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Player dialog
  const [playerDialog, setPlayerDialog] = useState<{
    videos: { id: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[];
    initialIndex: number;
    title: string;
  } | null>(null);

  // Order dialogs
  const [showSaveOrderDialog, setShowSaveOrderDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  // Download state
  const [downloadEpisode, setDownloadEpisode] = useState<SavedEpisode | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const toggleSelect = useCallback((episodeId: string) => {
    setSelectedIds((prev) => {
      const idx = prev.indexOf(episodeId);
      if (idx !== -1) return prev.filter((id) => id !== episodeId);
      return [...prev, episodeId];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(savedEpisodes.map((ep) => ep.id));
  }, [savedEpisodes]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedEpisodes = useMemo(
    () => savedEpisodes.filter((ep) => selectedIds.includes(ep.id)),
    [savedEpisodes, selectedIds],
  );

  // ── Play ──
  const handlePlayEpisode = useCallback((episode: SavedEpisode) => {
    setPlayerDialog({
      videos: [{
        id: episode.videoId,
        title: episode.title,
        thumbnailUrl: episode.thumbnailUrl,
        durationSeconds: episode.durationSeconds,
      }],
      initialIndex: 0,
      title: episode.title,
    });
  }, []);

  // ── Download ──
  const handleDownloadEpisode = useCallback((episode: SavedEpisode) => {
    setDownloadEpisode(episode);
    setDownloadError(null);
  }, []);

  const handleDownloadConfirm = useCallback(async () => {
    if (!downloadEpisode) return;
    const url = `https://www.youtube.com/watch?v=${downloadEpisode.videoId}`;
    setDownloading(true);
    try {
      const result = await startDownload(url);
      if (result?.downloadUrl) {
        triggerBrowserDownload(result.downloadUrl);
      }
      setDownloadEpisode(null);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }, [downloadEpisode]);

  // ── Save as Playlist ──

  const handleSaveAsPlaylist = useCallback(() => {
    setShowSaveOrderDialog(true);
  }, []);

  const handleSaveOrderConfirm = useCallback(
    (ordered: { id: string; videoId: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[], playlistName: string) => {
      setShowSaveOrderDialog(false);
      const episodeMap = new Map(selectedEpisodes.map((ep) => [ep.id, ep]));
      const orderedEpisodes = ordered
        .map((o) => episodeMap.get(o.id))
        .filter((ep): ep is SavedEpisode => ep !== undefined);

      if (orderedEpisodes.length === 0) return;

      const name = playlistName.trim() || `Playlist (${orderedEpisodes.length} episodes)`;
      const videos = orderedEpisodes.map((ep) => ({
        id: ep.videoId,
        title: ep.title,
        channelTitle: ep.channelTitle,
        thumbnailUrl: ep.thumbnailUrl,
        duration: ep.duration,
        durationSeconds: ep.durationSeconds,
        description: "",
        channelId: "",
        viewCount: 0,
        likeCount: 0,
        publishedAt: ep.savedAt,
        tags: [] as string[],
        videoType: "music" as const,
        singerName: undefined as string | undefined,
        singerId: undefined as string | undefined,
      }));

      const result = savePlaylistToStore(name, "", EMPTY_FILTERS, videos);
      if (!("error" in result)) {
        setIsSelecting(false);
        setSelectedIds([]);
      }
    },
    [selectedEpisodes, savePlaylistToStore],
  );

  // ── Merge ──
  const handleMergeSelected = useCallback(() => {
    if (selectedEpisodes.length < 2) return;
    setShowMergeDialog(true);
  }, [selectedEpisodes]);

  const handleMergeDialogConfirm = useCallback(
    (ordered: { id: string; videoId: string; title: string; thumbnailUrl?: string; durationSeconds?: number }[], mergeName: string) => {
      setShowMergeDialog(false);
      const episodeMap = new Map(selectedEpisodes.map((ep) => [ep.id, ep]));
      const orderedEpisodes = ordered
        .map((o) => episodeMap.get(o.id))
        .filter((ep): ep is SavedEpisode => ep !== undefined);

      if (orderedEpisodes.length < 2) return;

      startMerge(
        orderedEpisodes.map((ep) => ({ id: ep.videoId, title: ep.title, thumbnailUrl: ep.thumbnailUrl })),
        navigate,
        mergeName,
      );
      setIsSelecting(false);
      setSelectedIds([]);
    },
    [selectedEpisodes, navigate],
  );

  // ── Remove inside order dialogs ──
  const handleOrderRemove = useCallback(
    (episode: { id: string }) => {
      removeEpisode(episode.id);
    },
    [removeEpisode],
  );

  return (
    <SidebarLayout>
      <main className="animate-page-in mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Saved TV Series</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Your bookmarked shows and saved episodes
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty state — only when both saved series and episodes are empty */}
        {isLoaded && !hasSaved && episodesLoaded && savedEpisodes.length === 0 && !isLoading && (
          <div className="py-16">
            <EmptyState
              title="No saved TV series"
              message="Browse TV series on the home page and save your favorites to access them here."
              action={{
                label: "Browse TV Series",
                onClick: () => navigate("/"),
              }}
            />
          </div>
        )}

        {/* Selection badge */}
        {hasSelection && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-600/5 px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-xs font-medium text-blue-300">
              Selected: {selectedSeriesName || "Saved series"}
            </span>
            <button
              onClick={() => clearSelection()}
              className="ml-auto text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Clear
            </button>
          </div>
        )}

        {/* Generation error */}
        {generationError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2.5 text-xs text-red-300">
            {generationError}
          </div>
        )}

        {/* Generation controls */}
        {hasSaved && (
          <div className="mb-6 flex items-center gap-3">
            <FilterPanel />
            <Button
              onClick={handleGenerate}
              disabled={!hasSelection || isGenerating}
              loading={isGenerating}
              className="!h-10 shrink-0"
            >
              {isGenerating
                ? "Generating..."
                : hasSelection
                  ? "Generate Episodes"
                  : "Select a saved series"}
            </Button>
          </div>
        )}

        {/* Saved series grid */}
        {isLoaded && hasSaved && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {savedSeriesList.map((s) => {
              const isSelected = selectedSeriesId === s.id;
              return (
                <div
                  key={s.id}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-blue-500/50 bg-blue-600/10 ring-1 ring-blue-500/30"
                      : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900"
                  }`}
                  onClick={() => { selectSeries(s.id, s.name); }}
                >
                  {/* Unsave button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSave(s); }}
                    className="absolute top-2 right-2 rounded-full p-1 text-red-400/60 hover:text-red-300 transition-colors"
                    title="Remove from saved"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </button>

                  {/* Icon */}
                  <div className="relative mt-2">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-600/30 text-blue-300 ring-2 ring-blue-500/50"
                        : "bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700"
                    }`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSelected ? "text-blue-300" : "text-neutral-500"}>
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    {isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 shadow">
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 8l3 3 5-6" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name & channel */}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium text-neutral-200">{s.name}</p>
                    <p className="truncate text-xs text-neutral-500 mt-0.5">{s.channel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Saved Episodes section */}
        {episodesLoaded && savedEpisodes.length > 0 && (
          <div className="mt-12">
            {/* Episodes header with selection controls */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
                  Saved Episodes
                </h2>
                {isSelecting ? (
                  <span className="text-xs text-blue-400">
                    {selectedIds.length} selected
                  </span>
                ) : (
                  <span className="text-xs text-neutral-500">
                    {savedEpisodes.length} episode{savedEpisodes.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isSelecting ? (
                  <>
                    <button
                      onClick={selectedIds.length === savedEpisodes.length ? deselectAll : selectAll}
                      className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                    >
                      {selectedIds.length === savedEpisodes.length ? "Deselect all" : "Select all"}
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

            {/* Episodes grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {savedEpisodes.map((ep) => (
                <EpisodeTile
                  key={ep.id}
                  episode={ep}
                  isSelectable={isSelecting}
                  isSelected={selectedIds.includes(ep.id)}
                  onToggleSelect={() => toggleSelect(ep.id)}
                  onPlay={() => {
                    if (!isSelecting) handlePlayEpisode(ep);
                  }}
                  onRemove={() => {
                    if (isSelecting) return;
                    removeEpisode(ep.id);
                  }}
                  onDownload={() => {
                    if (!isSelecting) handleDownloadEpisode(ep);
                  }}
                />
              ))}
            </div>
          </div>
        )}
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

      {/* Save as Playlist order dialog */}
      {showSaveOrderDialog && (
        <MergeOrderDialog
          mode="playlist"
          songs={selectedEpisodes.map((ep) => ({
            id: ep.id,
            videoId: ep.videoId,
            title: ep.title,
            thumbnailUrl: ep.thumbnailUrl,
            duration: ep.duration,
            durationSeconds: ep.durationSeconds,
          }))}
          onConfirm={handleSaveOrderConfirm}
          onRemove={handleOrderRemove}
          onClose={() => setShowSaveOrderDialog(false)}
        />
      )}

      {/* Merge order dialog */}
      {showMergeDialog && (
        <MergeOrderDialog
          songs={selectedEpisodes.map((ep) => ({
            id: ep.id,
            videoId: ep.videoId,
            title: ep.title,
            thumbnailUrl: ep.thumbnailUrl,
            duration: ep.duration,
            durationSeconds: ep.durationSeconds,
          }))}
          onConfirm={handleMergeDialogConfirm}
          onRemove={handleOrderRemove}
          onClose={() => setShowMergeDialog(false)}
        />
      )}

      {/* Download confirmation dialog */}
      {downloadEpisode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onKeyDown={(e) => e.key === "Escape" && setDownloadEpisode(null)}>
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl animate-in">
            <h2 className="mb-1 text-lg font-semibold text-white">Download this episode?</h2>
            <p className="mb-4 text-sm text-neutral-400">
              "{downloadEpisode.title}" will be downloaded to the server. You can then save it to your computer from the Downloads page.
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
                onClick={() => setDownloadEpisode(null)}
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
