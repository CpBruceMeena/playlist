import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Spinner } from "../components/ui/Spinner";
import { FilterPanel } from "../components/search/FilterPanel";
import { useTVSeriesStore } from "../stores/tvSeriesStore";
import { useFilterStore } from "../stores/filterStore";

export function TVSeriesPage() {
  const navigate = useNavigate();
  const {
    series,
    channels,
    savedSeries,
    isLoaded,
    isLoading,
    error,
    selectedSeriesId,
    selectedSeriesName,
    customSeriesName,
    isGenerating,
    generationError,
    channelFilter,
    searchQuery,
    loadSeries,
    loadSavedSeries,
    toggleSave,
    isSeriesSaved,
    setChannelFilter,
    setSearchQuery,
    selectSeries,
    setCustomSeriesName,
    clearSelection,
    clearError,
    generate,
  } = useTVSeriesStore();

  const [customInput, setCustomInput] = useState("");

  useEffect(() => {
    loadSeries();
    loadSavedSeries();
  }, [loadSeries, loadSavedSeries]);

  const filteredSeries = useMemo(() => {
    let result = series;
    if (channelFilter) {
      result = result.filter((s) => s.channel === channelFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.channel.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => b.popularityScore - a.popularityScore);
  }, [series, channelFilter, searchQuery]);

  const savedSeriesList = useMemo(() => {
    return savedSeries
      .map((s) => series.find((sv) => sv.id === s.seriesId))
      .filter((s): s is typeof series[0] => s !== undefined)
      .slice(0, 10);
  }, [savedSeries, series]);

  function handleGenerate() {
    if (isGenerating) return;
    clearError();
    const filters = useFilterStore.getState().getFilterPayload();
    generate(filters).then(() => {
      navigate("/playlist");
    });
  }

  const hasSelection = selectedSeriesId !== null || customSeriesName.trim().length > 0;

  return (
    <SidebarLayout>
      <main className="animate-page-in mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">TV Series</h1>
          <p className="mt-0.5 text-xs text-neutral-500">
            Search for your favorite Indian TV shows and browse episodes
          </p>
        </div>

        {/* Search & generate row */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search TV series by name or channel..."
                className="w-full"
              />
            </div>
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
                  : "Select a series"}
            </Button>
          </div>

          {/* Generation error */}
          {generationError && (
            <div className="rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2.5 text-xs text-red-300">
              {generationError}
            </div>
          )}

          {/* Custom series name input */}
          <div className="border-t border-neutral-800/50 pt-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInput.trim()) {
                    setCustomSeriesName(customInput.trim());
                    selectSeries("", "");
                    setCustomInput("");
                  }
                }}
                placeholder="Or type a custom TV series name..."
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              />
              <button
                onClick={() => {
                  if (customInput.trim()) {
                    setCustomSeriesName(customInput.trim());
                    selectSeries("", "");
                    setCustomInput("");
                  }
                }}
                disabled={!customInput.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                Use Custom
              </button>
            </div>
            <p className="mt-2 text-[10px] text-neutral-600">
              Can't find a show? Type its name above and click "Use Custom" to search for episodes.
            </p>
          </div>

          {/* Selection badge */}
          {hasSelection && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-600/5 px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs font-medium text-blue-300">
                Selected: {selectedSeriesName || customSeriesName || "Custom series"}
              </span>
              <button
                onClick={() => {
                  clearSelection();
                  setCustomSeriesName("");
                }}
                className="ml-auto text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Clear
              </button>
            </div>
          )}

          <FilterPanel />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
            <button onClick={loadSeries} className="ml-2 underline hover:text-red-200">
              Retry
            </button>
          </div>
        )}

        {/* Saved series section */}
        {isLoaded && savedSeriesList.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-neutral-400 uppercase tracking-wider">
              Saved Series ({savedSeries.length})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {savedSeriesList.map((s) => {
                const isSelected = selectedSeriesId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => { selectSeries(s.id, s.name); setCustomSeriesName(""); }}
                    className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150 ${
                      isSelected
                        ? "border-blue-500/50 bg-blue-600/10 ring-1 ring-blue-500/30"
                        : "border-blue-500/30 bg-blue-600/5 ring-1 ring-blue-500/20"
                    }`}
                  >
                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600/30 text-lg font-bold text-blue-300 ring-2 ring-blue-500/50">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
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
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-neutral-200">{s.name}</p>
                      <p className="truncate text-xs text-neutral-500">{s.channel}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave(s); }}
                      className="rounded-full p-1 text-red-400/60 hover:text-red-300 transition-colors"
                      title="Remove from saved"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Channel filter chips */}
        {isLoaded && channels.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setChannelFilter(null)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                !channelFilter
                  ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              }`}
            >
              All Channels
            </button>
            {channels.map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch === channelFilter ? null : ch)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                  channelFilter === ch
                    ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        {/* Series grid */}
        {isLoaded && !error && filteredSeries.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-700 py-16 text-center">
            <p className="text-sm text-neutral-500">
              {searchQuery
                ? `No TV series found matching "${searchQuery}"`
                : "No TV series available"}
            </p>
          </div>
        )}

        {isLoaded && !error && filteredSeries.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredSeries.map((s) => {
              const isSelected = selectedSeriesId === s.id;
              const saved = isSeriesSaved(s.id);
              return (
                <div
                  key={s.id}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all duration-150 ${
                    isSelected
                      ? "border-blue-500/50 bg-blue-600/10 ring-1 ring-blue-500/30"
                      : saved
                        ? "border-emerald-500/30 bg-emerald-600/5 ring-1 ring-emerald-500/20"
                        : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900"
                  }`}
                >
                  {/* Save/unsave button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSave(s); }}
                    className={`absolute top-2 right-2 rounded-full p-1 transition-colors ${
                      saved
                        ? "text-red-400 hover:text-red-300"
                        : "text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-neutral-300"
                    }`}
                    title={saved ? "Remove from saved" : "Save series"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </button>

                  {/* Click to select */}
                  <button
                    onClick={() => {
                      selectSeries(s.id, s.name);
                      setCustomSeriesName("");
                    }}
                    className="flex flex-col items-center gap-2 w-full"
                  >
                    <div className="relative">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition-all duration-150 ${
                          isSelected
                            ? "bg-blue-600/30 text-blue-300 ring-2 ring-blue-500/50"
                            : "bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700"
                        }`}
                      >
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

                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium text-neutral-200">
                        {s.name}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <p className="truncate text-xs text-neutral-500">
                          {s.channel}
                        </p>
                        {s.genre && (
                          <span className="truncate rounded-full bg-neutral-800 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
                            {s.genre}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </SidebarLayout>
  );
}
