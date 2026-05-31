import { useEffect, useState, useMemo } from "react";
import type { Singer, FilterCriteria } from "@playlist/types";
import { useSingerStore } from "../../stores/singerStore";
import { usePlaylistStore } from "../../stores/playlistStore";
import { useFilterStore } from "../../stores/filterStore";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";

const GENRE_LABELS: Record<string, string> = {
  punjabi: "Punjabi",
  haryanvi: "Haryanvi",
  hindi: "Hindi",
  "old-hindi": "Old Hindi",
  english: "English",
};

const GENRE_COLORS: Record<string, string> = {
  punjabi: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  haryanvi: "bg-green-500/10 text-green-300 border-green-500/30",
  hindi: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  "old-hindi": "bg-amber-500/10 text-amber-300 border-amber-500/30",
  english: "bg-purple-500/10 text-purple-300 border-purple-500/30",
};

const RESULTS_OPTIONS = [5, 10, 15];

export function SingerSelector() {
  const navigate = useNavigate();
  const {
    singers,
    genres,
    isLoading,
    error,
    selectedSingerIds,
    resultsPerSinger,
    isGenerating,
    generationError,
    searchQuery,
    genreFilter,
    loadSingers,
    setGenreFilter,
    setSearchQuery,
    toggleSinger,
    setResultsPerSinger,
    clearSelection,
    generate,
  } = useSingerStore();

  const isGeneratingPlaylist = usePlaylistStore((s) => s.isGenerating);

  // Load singers on mount
  useEffect(() => {
    loadSingers();
  }, [loadSingers]);

  // Filter singers by genre and search query
  const filteredSingers = useMemo(() => {
    let result = singers;
    if (genreFilter) {
      result = result.filter((s) => s.genre === genreFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => b.popularityScore - a.popularityScore);
  }, [singers, genreFilter, searchQuery]);

  const selectedCount = selectedSingerIds.length;
  const canGenerate =
    selectedCount >= 2 && selectedCount <= 5 && !isGenerating && !isGeneratingPlaylist;
  const estimatedVideos = selectedCount * resultsPerSinger;

  function handleGenerate() {
    if (!canGenerate) return;
    const filters = useFilterStore.getState().getFilterPayload();
    generate(filters).then(() => {
      // Navigate to playlist page when generation completes
      navigate("/playlist");
    });
  }

  return (
    <div className="space-y-5 animate-in">
      {/* Search & genre filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search singers..."
            className="w-full"
          />
        </div>

        {/* Results per singer */}

        {/* Selection count badge */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-neutral-400 shrink-0">
            <span className="rounded-full bg-blue-600/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
              {selectedCount}/5 selected
            </span>
            <button
              onClick={clearSelection}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Genre filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setGenreFilter(null)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
            !genreFilter
              ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
          }`}
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setGenreFilter(genre === genreFilter ? null : genre)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
              genreFilter === genre
                ? `${GENRE_COLORS[genre] || "bg-blue-600/20 text-blue-300 border-blue-500/40"} ring-1`
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
            }`}
          >
            {GENRE_LABELS[genre] || genre}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
          <button
            onClick={loadSingers}
            className="ml-2 underline hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredSingers.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-700 py-12 text-center">
          <p className="text-sm text-neutral-500">
            {searchQuery
              ? `No singers found matching "${searchQuery}"`
              : "No singers available"}
          </p>
        </div>
      )}

      {/* Singer grid */}
      {!isLoading && !error && filteredSingers.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredSingers.map((singer) => {
            const isSelected = selectedSingerIds.includes(singer.id);
            const isMaxed = !isSelected && selectedCount >= 5;

            return (
              <button
                key={singer.id}
                onClick={() => toggleSinger(singer.id)}
                disabled={isMaxed && !isSelected}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150 ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-600/10 ring-1 ring-blue-500/30"
                    : isMaxed
                      ? "border-neutral-800/50 bg-neutral-900/30 opacity-40 cursor-not-allowed"
                      : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900"
                }`}
              >
                {/* Avatar circle */}
                <div className="relative">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-600/30 text-blue-300 ring-2 ring-blue-500/50"
                        : "bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700"
                    }`}
                  >
                    {singer.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Check indicator */}
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 shadow">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4 8l3 3 5-6" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name & genre */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-200">
                    {singer.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {GENRE_LABELS[singer.genre] || singer.genre}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Results per singer & generate section */}
      {selectedCount >= 2 && (
        <div className="rounded-xl border border-blue-900/50 bg-blue-950/30 px-5 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-200">
                {selectedCount} singers selected
              </p>
              <p className="text-xs text-blue-400/70">
                Estimated ~{estimatedVideos} videos ({resultsPerSinger} per
                singer)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-neutral-400">Per singer:</label>
                <select
                  value={resultsPerSinger}
                  onChange={(e) => setResultsPerSinger(Number(e.target.value))}
                  className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-blue-500"
                >
                  {RESULTS_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                loading={isGenerating || isGeneratingPlaylist}
              >
                Generate Combined Playlist
              </Button>
            </div>
          </div>

          {/* Generation error */}
          {generationError && (
            <p className="mt-3 text-xs text-red-400">{generationError}</p>
          )}
        </div>
      )}
    </div>
  );
}
