import { useState } from "react";
import type { VideoType } from "@playlist/types";
import { useFilterStore } from "../../stores/filterStore";
import { DurationSlider } from "./DurationSlider";
import { UploadDateSelect } from "./UploadDateSelect";
import { Input } from "../ui/Input";
import { Toggle } from "../ui/Toggle";
import { Chip } from "../ui/Chip";
import { Button } from "../ui/Button";

const VIDEO_TYPE_OPTIONS: { value: VideoType; label: string; icon: string }[] = [
  { value: "music", label: "Music", icon: "🎵" },
  { value: "live", label: "Live", icon: "🔴" },
  { value: "shorts", label: "Shorts", icon: "📱" },
  { value: "standard", label: "Standard", icon: "🎬" },
];

export function FilterPanel() {
  const {
    durationMin,
    durationMax,
    videoTypes,
    includeKeywords,
    excludeKeywords,
    uploadDate,
    minViews,
    maxResults,
    safeSearch,
    isExpanded,
    toggleVideoType,
    setDurationMin,
    setDurationMax,
    addIncludeKeyword,
    removeIncludeKeyword,
    addExcludeKeyword,
    removeExcludeKeyword,
    setUploadDate,
    setMinViews,
    setMaxResults,
    setSafeSearch,
    resetFilters,
    togglePanel,
    getActiveFilterCount,
  } = useFilterStore();

  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");

  const activeCount = getActiveFilterCount();

  function handleAddInclude() {
    if (includeInput.trim()) {
      addIncludeKeyword(includeInput);
      setIncludeInput("");
    }
  }

  function handleAddExclude() {
    if (excludeInput.trim()) {
      addExcludeKeyword(excludeInput);
      setExcludeInput("");
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden transition-all duration-200">
      {/* Toggle header */}
      <button
        onClick={togglePanel}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-800/40 group"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-neutral-300">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-500 transition-colors group-hover:bg-neutral-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
            </svg>
          </span>
          Filters &amp; Refinements
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600/90 px-2 py-0.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                resetFilters();
              }}
              className="text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Reset
            </span>
          )}
          <svg
            className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="border-t border-neutral-800">
          {/* Video Type + Duration — side by side on desktop, aligned top */}
          <div className="grid gap-6 border-b border-neutral-800/50 px-5 py-5 sm:grid-cols-2 items-start">
            {/* Video Type */}
            <div>
              <label className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Video Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VIDEO_TYPE_OPTIONS.map((option) => {
                  const isActive = videoTypes.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleVideoType(option.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40 shadow-sm"
                          : "bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                      }`}
                    >
                      <span className="text-[11px]">{option.icon}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Duration
              </label>
              <DurationSlider
                durationMin={durationMin}
                durationMax={durationMax}
                onDurationMinChange={setDurationMin}
                onDurationMaxChange={setDurationMax}
              />
            </div>
          </div>

          {/* Upload Date + Min Views — side by side on desktop, aligned top */}
          <div className="grid gap-6 border-b border-neutral-800/50 px-5 py-5 sm:grid-cols-2 items-start">
            {/* Upload Date */}
            <div>
              <label className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Upload Date
              </label>
              <UploadDateSelect
                value={uploadDate}
                onChange={setUploadDate}
              />
            </div>

            {/* Min Views */}
            <div>
              <label htmlFor="min-views" className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Min Views
              </label>
              <select
                id="min-views"
                name="minViews"
                value={minViews ?? ""}
                onChange={(e) =>
                  setMinViews(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800/80 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
              >
                <option value="">No minimum</option>
                <option value="1000">1K+</option>
                <option value="10000">10K+</option>
                <option value="100000">100K+</option>
                <option value="1000000">1M+</option>
              </select>
            </div>
          </div>

          {/* Keywords section */}
          <div className="border-b border-neutral-800/50 px-5 py-5">
            <label className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Keywords
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Include */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                  Must include
                </label>
                <div className="flex gap-2">
                  <Input
                    value={includeInput}
                    onChange={(e) => setIncludeInput(e.target.value)}
                    placeholder="keyword..."
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddInclude();
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddInclude}
                    disabled={!includeInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {includeKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {includeKeywords.map((kw) => (
                      <Chip
                        key={kw}
                        label={kw}
                        variant="active"
                        onRemove={() => removeIncludeKeyword(kw)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Exclude */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-400">
                  Exclude
                </label>
                <div className="flex gap-2">
                  <Input
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    placeholder="keyword..."
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddExclude();
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddExclude}
                    disabled={!excludeInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {excludeKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {excludeKeywords.map((kw) => (
                      <Chip
                        key={kw}
                        label={kw}
                        variant="active"
                        onRemove={() => removeExcludeKeyword(kw)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom row: Max Results + Safe Search + Reset */}
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Max Results */}
              <div className="flex items-center gap-2.5">
                <label htmlFor="max-results" className="text-xs font-medium text-neutral-400">
                  Max results
                </label>
                <select
                  id="max-results"
                  name="maxResults"
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="rounded-lg border border-neutral-700 bg-neutral-800/80 px-2.5 py-1.5 text-xs text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
                >
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              {/* Safe Search */}
              <Toggle
                checked={safeSearch}
                onChange={setSafeSearch}
                label="Safe search"
                description="Filter explicit content"
              />
            </div>

            {/* Reset */}
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-neutral-500"
              >
                Reset all filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
