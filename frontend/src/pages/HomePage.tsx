import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { SearchInput } from "../components/search/SearchInput";
import { FilterPanel } from "../components/search/FilterPanel";
import { ActiveFilterBar } from "../components/search/ActiveFilterBar";
import { EmptyState } from "../components/feedback/EmptyState";
import { LoadingSkeleton } from "../components/feedback/LoadingSkeleton";
import { ErrorState } from "../components/feedback/ErrorState";
import { useFilterStore } from "../stores/filterStore";
import { usePlaylistStore } from "../stores/playlistStore";

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
  const { query, setQuery, resetFilters } = useFilterStore();
  const { generate, isGenerating, error, videos, clearError } = usePlaylistStore();

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

  const isZeroResultsError =
    error?.includes("No videos found") || error?.includes("adjust your filters");

  // Navigate to playlist page when generation completes
  useEffect(() => {
    if (videos.length > 0 && !isGenerating) {
      navigate("/playlist/new");
    }
  }, [videos, isGenerating, navigate]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header />

      <main className="mx-auto max-w-3xl px-4 pt-16 sm:pt-24">
        {/* Hero section */}
        <div className="text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-blue-500/10 px-4 py-2">
            <span className="text-sm font-medium text-blue-400">
              🎵 AI-Powered YouTube Playlists
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Generate the perfect{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              playlist
            </span>
          </h1>
          <p className="mt-4 text-lg text-neutral-400">
            Describe what you want to hear — we'll search YouTube and build a
            custom playlist with smart filters.
          </p>
        </div>

        {/* Search section */}
        <div className="mt-10">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            loading={isGenerating}
            suggestions={SUGGESTIONS}
          />
        </div>

        {/* Active filter summary — visible when panel is collapsed */}
        <div className="mt-3">
          <ActiveFilterBar />
        </div>

        {/* Filters */}
        <div className="mt-4">
          <FilterPanel />
        </div>

        {/* Results area */}
        <div className="mt-8">
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
      </main>
    </div>
  );
}
