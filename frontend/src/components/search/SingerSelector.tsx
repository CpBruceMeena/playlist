import { useEffect, useMemo, useState } from "react";
import { useSingerStore } from "../../stores/singerStore";
import { Input } from "../ui/Input";
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

export function SingerSelector() {
  const {
    singers,
    genres,
    isLoading,
    error,
    selectedSingerIds,
    customSingerNames,
    searchQuery,
    genreFilter,
    loadSingers,
    setGenreFilter,
    setSearchQuery,
    toggleSinger,
    addCustomSinger,
    removeCustomSinger,
  } = useSingerStore();

  const [customInput, setCustomInput] = useState("");

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

  const selectedCount = selectedSingerIds.length + customSingerNames.length;
  const totalSelected = selectedCount;
  const canAddMore = totalSelected < 5;

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

      {/* Custom singer input */}
      <div className="border-t border-neutral-800/50 pt-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customInput.trim()) {
                addCustomSinger(customInput);
                setCustomInput("");
              }
            }}
            placeholder={canAddMore ? "Add a custom singer name..." : "Max 5 singers reached"}
            disabled={!canAddMore}
            className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 disabled:opacity-40"
          />
          <button
            onClick={() => {
              if (customInput.trim() && canAddMore) {
                addCustomSinger(customInput);
                setCustomInput("");
              }
            }}
            disabled={!customInput.trim() || !canAddMore}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Add
          </button>
        </div>
        {customSingerNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {customSingerNames.map((name, idx) => (
              <span
                key={`custom-${idx}`}
                className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-600/15 px-2.5 py-1 text-xs font-medium text-blue-300"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {name}
                <button
                  onClick={() => removeCustomSinger(idx)}
                  className="ml-0.5 rounded-full p-0.5 text-blue-300/60 transition-colors hover:bg-blue-500/20 hover:text-blue-200"
                  aria-label={`Remove ${name}`}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-2 text-[10px] text-neutral-600">
          Can't find a singer? Type their name above to add them as a custom search.
        </p>
      </div>

      {/* Singer grid */}
      {!isLoading && !error && filteredSingers.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredSingers.map((singer) => {
            const isSelected = selectedSingerIds.includes(singer.id);
            const isMaxed = !isSelected && totalSelected >= 5;

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

    </div>
  );
}

/**
 * Compact singer selector for use inside the SingerDrawer panel.
 * No Generate button — just search, filter, and selection.
 */
export function SingerSelectorDrawer() {
  const {
    singers,
    genres,
    isLoading,
    error,
    selectedSingerIds,
    searchQuery,
    genreFilter,
    loadSingers,
    setGenreFilter,
    setSearchQuery,
    toggleSinger,
  } = useSingerStore();

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

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search singers..."
          className="w-full"
        />
      </div>

      {/* Genre filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setGenreFilter(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
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
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
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
        <div className="flex items-center justify-center py-10">
          <Spinner size="md" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-3 py-2.5 text-sm text-red-300">
          {error}
          <button onClick={loadSingers} className="ml-2 underline hover:text-red-200">
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredSingers.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-700 py-10 text-center">
          <p className="text-sm text-neutral-500">
            {searchQuery
              ? `No singers found matching "${searchQuery}"`
              : "No singers available"}
          </p>
        </div>
      )}

      {/* Singer grid */}
      {!isLoading && !error && filteredSingers.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {filteredSingers.map((singer) => {
            const isSelected = selectedSingerIds.includes(singer.id);
            const isMaxed = !isSelected && selectedCount >= 5;

            return (
              <button
                key={singer.id}
                onClick={() => toggleSinger(singer.id)}
                disabled={isMaxed && !isSelected}
                className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all duration-150 ${
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
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-600/30 text-blue-300 ring-2 ring-blue-500/50"
                        : "bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700"
                    }`}
                  >
                    {singer.name.charAt(0).toUpperCase()}
                  </div>
                  {isSelected && (
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow">
                      <svg
                        width="8"
                        height="8"
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
    </div>
  );
}
