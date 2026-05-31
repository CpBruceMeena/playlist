import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { SearchInput } from "../components/search/SearchInput";
import { FilterPanel } from "../components/search/FilterPanel";
import { ActiveFilterBar } from "../components/search/ActiveFilterBar";
import { SingerDrawer } from "../components/search/SingerDrawer";
import { EmptyState } from "../components/feedback/EmptyState";
import { LoadingSkeleton } from "../components/feedback/LoadingSkeleton";
import { ErrorState } from "../components/feedback/ErrorState";
import { useFilterStore } from "../stores/filterStore";
import { usePlaylistStore } from "../stores/playlistStore";
import { useSingerStore } from "../stores/singerStore";

const SUGGESTIONS = [
  "Lofi beats to study to",
  "90s rock classics",
  "Arijit Singh love songs",
  "Upbeat workout motivation",
  "Jazz hip hop for coding",
  "EDM festival mix 2024",
  "Chill acoustic covers",
  "Bollywood party playlist",
];

export function HomePage() {
  const navigate = useNavigate();
  const [showSingerDrawer, setShowSingerDrawer] = useState(false);
  const { query, setQuery, resetFilters } = useFilterStore();
  const {
    generate,
    isGenerating,
    error,
    videos,
    clearError,
    clearPlaylist,
  } = usePlaylistStore();
  const selectedSingerIds = useSingerStore((s) => s.selectedSingerIds);
  const singers = useSingerStore((s) => s.singers);

  // Clear stale playlist state when returning to home (prevents auto-redirect)
  useEffect(() => {
    if (videos.length > 0) {
      clearPlaylist();
    }
  }, []);

  function handleSubmit() {
    if (!query.trim() || isGenerating) return;
    generate(query.trim(), useFilterStore.getState().getFilterPayload());
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    generate(suggestion, useFilterStore.getState().getFilterPayload());
  }

  function handleResetFilters() {
    resetFilters();
    clearError();
  }

  // Sync selected singer names into the search bar query whenever selection changes
  const syncSingerNames = useCallback(() => {
    if (selectedSingerIds.length === 0) {
      // Clear singer names from query when all deselected
      setQuery("");
      return;
    }
    const names = singers
      .filter((s) => selectedSingerIds.includes(s.id))
      .map((s) => s.name)
      .join(", ");
    if (names) {
      setQuery(names);
    }
  }, [selectedSingerIds, singers, setQuery]);

  // When drawer closes, sync singer names to search bar
  function handleDrawerClose() {
    setShowSingerDrawer(false);
  }

  // Sync when selection changes (real-time — both in drawer and on close)
  useEffect(() => {
    syncSingerNames();
  }, [selectedSingerIds, syncSingerNames]);

  const isZeroResultsError =
    error?.includes("No videos found") || error?.includes("adjust your filters");

  // Navigate to playlist page when generation completes
  useEffect(() => {
    if (videos.length > 0 && !isGenerating) {
      navigate("/playlist");
    }
  }, [videos, isGenerating, navigate]);

  const hasSingers = selectedSingerIds.length > 0;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header />

      <main className="animate-page-in mx-auto max-w-5xl px-4 pt-16 sm:pt-24">
        {/* Hero section */}
        <div className="text-center">
          <div className="gradient-glow mb-6 inline-flex items-center justify-center rounded-2xl bg-blue-500/10 px-4 py-2">
            <span className="text-sm font-medium text-blue-400">
              🎵 AI-Powered YouTube Playlists
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Generate the perfect{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              playlist
            </span>
          </h1>
          <p className="mt-4 text-lg text-neutral-400">
            Describe what you want to hear, or combine songs from your favorite
            singers — we'll build a smart playlist from YouTube.
          </p>
        </div>

        {/* Search section */}
        <div className="mt-10 space-y-4">
          {/* Search input */}
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            loading={isGenerating}
            suggestions={SUGGESTIONS}
          />

          {/* Action row: Singers button + active filters summary */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSingerDrawer(true)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-150 ${
                hasSingers
                  ? "border-blue-500/50 bg-blue-600/15 text-blue-300 hover:bg-blue-600/25"
                  : "border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              Singers
              {hasSingers && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/30 text-[11px] font-bold text-blue-200">
                  {selectedSingerIds.length}
                </span>
              )}
            </button>

            <ActiveFilterBar />
          </div>

          {/* Filters */}
          <FilterPanel />

          {/* Results area */}
          <div className="mt-6">
            {error && (
              <ErrorState
                title={isZeroResultsError ? "No videos found" : "Generation failed"}
                message={error}
                onRetry={handleSubmit}
                onSecondaryAction={
                  isZeroResultsError
                    ? { label: "Reset filters", onClick: handleResetFilters }
                    : undefined
                }
                variant="inline"
              />
            )}

            {isGenerating && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                  Generating your playlist...
                </div>
                <LoadingSkeleton variant="cards" count={6} />
              </div>
            )}

            {!isGenerating && !error && videos.length === 0 && (
              <EmptyState
                title="Ready to create"
                message="Type a description above and hit Generate to create your smart playlist."
                suggestions={SUGGESTIONS.map((s) => ({
                  label: s,
                  onClick: () => handleSuggestionClick(s),
                }))}
                variant="inline"
              />
            )}
          </div>
        </div>
      </main>

      {/* Singer selection drawer */}
      <SingerDrawer open={showSingerDrawer} onClose={handleDrawerClose} />
    </div>
  );
}
