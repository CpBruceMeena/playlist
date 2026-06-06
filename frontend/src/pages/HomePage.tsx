import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { SearchInput } from "../components/search/SearchInput";
import { FilterPanel } from "../components/search/FilterPanel";
import { ActiveFilterBar } from "../components/search/ActiveFilterBar";
import { SingerDrawer } from "../components/search/SingerDrawer";
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
  const customSingerNames = useSingerStore((s) => s.customSingerNames);
  const singers = useSingerStore((s) => s.singers);

  const singerGenerate = useSingerStore((s) => s.generate);

  // Clear stale playlist state when returning to home (prevents auto-redirect)
  useEffect(() => {
    if (videos.length > 0) {
      clearPlaylist();
    }
  }, []);

  function handleSubmit() {
    if (isGenerating) return;

    const totalSingers = selectedSingerIds.length + customSingerNames.length;

    // If singers selected but no query
    if (!query.trim()) {
      if (totalSingers >= 2) {
        // Directly trigger multi-singer generation
        const filters = useFilterStore.getState().getFilterPayload();
        singerGenerate(filters);
      } else if (totalSingers === 1) {
        // Only 1 singer — open drawer to prompt user to select more
        setShowSingerDrawer(true);
      }
      return;
    }
    generate(query.trim(), useFilterStore.getState().getFilterPayload());
  }

  function handleResetFilters() {
    resetFilters();
    clearError();
  }

  function handleDrawerClose() {
    setShowSingerDrawer(false);
  }

  const isZeroResultsError =
    error?.includes("No videos found") || error?.includes("adjust your filters");

  // Navigate to playlist page when generation completes
  useEffect(() => {
    if (videos.length > 0 && !isGenerating) {
      navigate("/playlist");
    }
  }, [videos, isGenerating, navigate]);

  const totalSingers = selectedSingerIds.length + customSingerNames.length;
  const hasSingers = totalSingers > 0;
  const selectedSingerObjects = singers.filter((s) =>
    selectedSingerIds.includes(s.id)
  );

  return (
    <SidebarLayout noTopBar>
      <main className="animate-page-in mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4">
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
            hasSingers={hasSingers}
          />

          {/* Action row: compact singer controls + active filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Singer button — compact pill */}
            <button
              onClick={() => setShowSingerDrawer(true)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 " +
                (hasSingers
                  ? "border-blue-500/40 bg-blue-600/15 text-blue-300 hover:bg-blue-600/25"
                  : "border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200")
              }
            >
              <svg
                width="12"
                height="12"
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
                <span className="-mr-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/40 text-[10px] font-bold text-blue-200">
                  {selectedSingerIds.length}
                </span>
              )}
            </button>

            {/* Selected singer chips — inline right after the button */}
            {selectedSingerObjects.map((singer) => (
              <span
                key={singer.id}
                className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-600/8 px-2 py-0.5 text-xs font-medium text-blue-300"
              >
                {singer.name}
                <button
                  onClick={() => {
                    useSingerStore.getState().toggleSinger(singer.id);
                  }}
                  className="rounded-full p-0.5 text-blue-300/50 transition-colors hover:bg-blue-500/20 hover:text-blue-200"
                  aria-label={"Remove " + singer.name}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              </span>
            ))}

            {/* Clear all link */}
            {hasSingers && (
              <button
                onClick={() => {
                  useSingerStore.getState().clearSelection();
                }}
                className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Clear all
              </button>
            )}

            {/* Active filter chips */}
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


          </div>
        </div>
      </main>

      {/* Singer selection drawer */}
      <SingerDrawer open={showSingerDrawer} onClose={handleDrawerClose} />
    </SidebarLayout>
  );
}
