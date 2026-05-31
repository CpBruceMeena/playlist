import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { SearchInput } from "../components/search/SearchInput";
import { FilterPanel } from "../components/search/FilterPanel";
import { ActiveFilterBar } from "../components/search/ActiveFilterBar";
import { SingerSelector } from "../components/search/SingerSelector";
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

type TabMode = "search" | "singers";

export function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabMode>("search");
  const { query, setQuery, resetFilters } = useFilterStore();
  const {
    generate,
    isGenerating,
    error,
    videos,
    clearError,
    clearPlaylist,
  } = usePlaylistStore();
  const singerNames = useSingerStore((s) => s.singerNames);

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

  const isZeroResultsError =
    error?.includes("No videos found") || error?.includes("adjust your filters");

  // Navigate to playlist page when generation completes
  useEffect(() => {
    if (videos.length > 0 && !isGenerating && tab === "search") {
      navigate("/playlist");
    }
  }, [videos, isGenerating, navigate, tab]);

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

        {/* Tab navigation */}
        <div className="mt-10 flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/50 p-1">
          <button
            onClick={() => setTab("search")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
              tab === "search"
                ? "bg-blue-600/20 text-blue-300 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Search
          </button>
          <button
            onClick={() => setTab("singers")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
              tab === "singers"
                ? "bg-blue-600/20 text-blue-300 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Singers
            {Object.keys(singerNames).length > 0 && (
              <span className="h-2 w-2 rounded-full bg-green-500" />
            )}
          </button>
        </div>

        {/* Tab content with cross-fade */}
        <div className="relative">
          {/* No absolute positioning — natural flow for each tab */}
          {tab === "search" && (
            <div className="mt-6 space-y-4">
              {/* Search section */}
              <SearchInput
                value={query}
                onChange={setQuery}
                onSubmit={handleSubmit}
                loading={isGenerating}
                suggestions={SUGGESTIONS}
              />

              {/* Active filter summary */}
              <ActiveFilterBar />

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
          )}

          {tab === "singers" && (
            <div className="mt-6">
              <SingerSelector />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
