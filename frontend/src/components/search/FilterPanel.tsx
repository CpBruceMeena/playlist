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
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50">
      {/* Toggle header */}
      <button
        onClick={togglePanel}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-neutral-800/50"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-300">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
              {activeCount}
            </span>
          )}
        </span>
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
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="space-y-6 border-t border-neutral-800 px-5 py-5">
          {/* Video Type */}
          <div>
            <label className="mb-2.5 block text-sm font-medium text-neutral-300">
              Video Type
            </label>
            <div className="flex flex-wrap gap-2">
              {VIDEO_TYPE_OPTIONS.map((option) => {
                const isActive = videoTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleVideoType(option.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration */}
          <DurationSlider
            durationMin={durationMin}
            durationMax={durationMax}
            onDurationMinChange={setDurationMin}
            onDurationMaxChange={setDurationMax}
          />

          {/* Upload Date */}
          <UploadDateSelect
            value={uploadDate}
            onChange={setUploadDate}
          />

          {/* Include Keywords */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Must include
            </label>
            <div className="flex gap-2">
              <Input
                value={includeInput}
                onChange={(e) => setIncludeInput(e.target.value)}
                placeholder="keyword..."
                className="flex-1"
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

          {/* Exclude Keywords */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Exclude
            </label>
            <div className="flex gap-2">
              <Input
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                placeholder="keyword..."
                className="flex-1"
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

          {/* Min Views */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Minimum views
            </label>
            <select
              value={minViews ?? ""}
              onChange={(e) =>
                setMinViews(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No minimum</option>
              <option value="1000">1K+</option>
              <option value="10000">10K+</option>
              <option value="100000">100K+</option>
              <option value="1000000">1M+</option>
            </select>
          </div>

          {/* Max Results */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Max results
            </label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            description="Filter out potentially explicit content"
          />

          {/* Reset */}
          {activeCount > 0 && (
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Reset all filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
