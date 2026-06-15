import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { FilterPanel } from "./FilterPanel";
import { useTVSeriesStore } from "../../stores/tvSeriesStore";
import { useFilterStore } from "../../stores/filterStore";

interface TVSeriesDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function TVSeriesDrawer({ open, onClose }: TVSeriesDrawerProps) {
  const navigate = useNavigate();
  const [tvCustomInput, setTvCustomInput] = useState("");

  const {
    series: tvSeries,
    channels: tvChannels,
    savedSeries: tvSavedSeries,
    isLoaded: tvLoaded,
    isLoading: tvLoading,
    selectedSeriesId,
    selectedSeriesName,
    customSeriesName,
    isGenerating: tvGenerating,
    error: tvSeriesError,
    generationError: tvGenerationError,
    channelFilter: tvChannelFilter,
    searchQuery: tvSearchQuery,
    loadSeries: tvLoadSeries,
    toggleSave: tvToggleSave,
    isSeriesSaved,
    setChannelFilter: tvSetChannelFilter,
    setSearchQuery: tvSetSearchQuery,
    selectSeries: tvSelectSeries,
    setCustomSeriesName: tvSetCustomSeriesName,
    clearSelection: tvClearSelection,
    clearError: tvClearError,
    generate: tvGenerate,
  } = useTVSeriesStore();

  useEffect(() => {
    tvLoadSeries();
  }, [tvLoadSeries]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const filteredTVSeries = useMemo(() => {
    let result = tvSeries;
    if (tvChannelFilter) {
      result = result.filter((s) => s.channel === tvChannelFilter);
    }
    if (tvSearchQuery.trim()) {
      const q = tvSearchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.channel.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => b.popularityScore - a.popularityScore);
  }, [tvSeries, tvChannelFilter, tvSearchQuery]);

  const tvHasSelection = selectedSeriesId !== null || customSeriesName.trim().length > 0;

  const handleTVGenerate = useCallback(() => {
    if (tvGenerating) return;
    tvClearError();
    const filters = useFilterStore.getState().getFilterPayload();
    tvGenerate(filters).then(() => {
      onClose();
      navigate("/playlist");
    });
  }, [tvGenerating, tvClearError, tvGenerate, onClose, navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative flex w-full max-w-[480px] flex-col bg-neutral-950 shadow-2xl"
        style={{ animation: "slideInRight 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-400"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <h2 className="text-base font-semibold text-white">TV Series</h2>
          </div>
          <div className="flex items-center gap-3">
            {tvSavedSeries.length > 0 && (
              <button
                onClick={() => { onClose(); navigate("/tv-series"); }}
                className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Saved ({tvSavedSeries.length})
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              aria-label="Close TV series panel"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l10 10M14 4l-10 10" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Selection badge at top */}
          {tvHasSelection && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-600/5 px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs font-medium text-blue-300">
                Selected: {selectedSeriesName || customSeriesName || "Custom series"}
              </span>
              <button
                onClick={() => { tvClearSelection(); tvSetCustomSeriesName(""); }}
                className="ml-auto text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Clear
              </button>
            </div>
          )}

          {/* Channel filter chips */}
          {tvLoaded && tvChannels.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => tvSetChannelFilter(null)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                  !tvChannelFilter
                    ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                    : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                }`}
              >
                All
              </button>
              {tvChannels.slice(0, 8).map((ch) => (
                <button
                  key={ch}
                  onClick={() => tvSetChannelFilter(ch === tvChannelFilter ? null : ch)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                    tvChannelFilter === ch
                      ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                      : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="mb-4">
            <Input
              value={tvSearchQuery}
              onChange={(e) => tvSetSearchQuery(e.target.value)}
              placeholder="Search TV series by name or channel..."
              className="w-full"
            />
          </div>

          {/* Custom series name */}
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              value={tvCustomInput}
              onChange={(e) => setTvCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tvCustomInput.trim()) {
                  tvSetCustomSeriesName(tvCustomInput.trim());
                  tvSelectSeries("", "");
                  setTvCustomInput("");
                }
              }}
              placeholder="Or type a custom name..."
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
            <button
              onClick={() => {
                if (tvCustomInput.trim()) {
                  tvSetCustomSeriesName(tvCustomInput.trim());
                  tvSelectSeries("", "");
                  setTvCustomInput("");
                }
              }}
              disabled={!tvCustomInput.trim()}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Use Custom
            </button>
          </div>

          <FilterPanel />

          {/* Loading */}
          {tvLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* TV Series loading error */}
          {tvSeriesError && (
            <div className="rounded-lg border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
              {tvSeriesError}
              <button onClick={tvLoadSeries} className="ml-2 underline hover:text-red-200">Retry</button>
            </div>
          )}

          {/* Generation error */}
          {tvGenerationError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 px-4 py-2.5 text-xs text-red-300">
              {tvGenerationError}
            </div>
          )}

          {/* Empty state */}
          {tvLoaded && !tvLoading && !tvSeriesError && filteredTVSeries.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-500">
                {tvSearchQuery
                  ? `No TV series found matching "${tvSearchQuery}"`
                  : "No TV series available"}
              </p>
            </div>
          )}

          {/* Series grid */}
          {tvLoaded && !tvLoading && filteredTVSeries.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredTVSeries.map((s) => {
                const isSelected = selectedSeriesId === s.id;
                const saved = isSeriesSaved(s.id);
                return (
                  <div
                    key={s.id}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "border-blue-500/50 bg-blue-600/10 ring-1 ring-blue-500/30"
                        : saved
                          ? "border-emerald-500/30 bg-emerald-600/5 ring-1 ring-emerald-500/20"
                          : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900"
                    }`}
                    onClick={() => { tvSelectSeries(s.id, s.name); tvSetCustomSeriesName(""); }}
                  >
                    {/* Save/unsave button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); tvToggleSave(s); }}
                      className={`absolute top-1.5 right-1.5 rounded-full p-1 transition-colors ${
                        saved
                          ? "text-red-400 hover:text-red-300"
                          : "text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-neutral-300"
                      }`}
                      title={saved ? "Remove from saved" : "Save series"}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                      </svg>
                    </button>

                    {/* Series icon */}
                    <div className="relative mt-1">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold transition-all duration-150 ${
                        isSelected
                          ? "bg-blue-600/30 text-blue-300 ring-2 ring-blue-500/50"
                          : "bg-neutral-800 text-neutral-500 group-hover:bg-neutral-700"
                      }`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSelected ? "text-blue-300" : "text-neutral-500"}>
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                      {isSelected && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 shadow">
                          <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 8l3 3 5-6" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-medium text-neutral-200">{s.name}</p>
                      <p className="truncate text-[10px] text-neutral-500 mt-0.5">{s.channel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-5 py-4 space-y-3">
          {tvHasSelection && (
            <button
              onClick={handleTVGenerate}
              disabled={tvGenerating}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tvGenerating ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Episodes"
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
          >
            {tvHasSelection ? "Done" : "Cancel"}
          </button>
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
