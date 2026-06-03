import { useState } from "react";
import type { VideoType, UploadDateRange } from "@playlist/types";
import { useFilterStore } from "../../stores/filterStore";
import { Slider } from "../ui/Slider";
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

const UPLOAD_OPTIONS: { value: UploadDateRange["type"]; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "last_week", label: "Past week" },
  { value: "last_month", label: "Past month" },
  { value: "last_year", label: "Past year" },
];

const VIEW_OPTIONS = [
  { value: undefined, label: "Any" },
  { value: 1000, label: "1K" },
  { value: 10000, label: "10K" },
  { value: 100000, label: "100K" },
  { value: 1000000, label: "1M" },
];

const DURATION_PRESETS = [
  { label: "< 1 min", min: undefined, max: 60 },
  { label: "1-4 min", min: 60, max: 240 },
  { label: "4-10 min", min: 240, max: 600 },
  { label: "10-20 min", min: 600, max: 1200 },
  { label: "> 20 min", min: 1200, max: undefined },
];

function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined) return "Any";
  if (seconds === 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
}

export function FilterPanel() {
  const {
    durationMin,
    durationMax,
    selectedDurationPresets,
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
    toggleDurationPreset,
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
      {/* ── Toggle header ── */}
      <button
        onClick={togglePanel}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-neutral-800/40 group"
        aria-expanded={isExpanded}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-neutral-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          Filters &amp; Refinements
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-neutral-500 transition-transform duration-200 ${
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

      {/* ── Collapsible content ── */}
      {isExpanded && (
        <div className="border-t border-neutral-800 text-sm">
          {/* ── Row: Video Type ── */}
          <div className="flex items-start gap-4 px-4 py-3.5 border-b border-neutral-800/50">
            <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-neutral-500 w-[90px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Type
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VIDEO_TYPE_OPTIONS.map((option) => {
                const isActive = videoTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleVideoType(option.value)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30"
                        : "bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    <span className="text-[10px]">{option.icon}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Row: Duration (multi-select) ── */}
          <div className="px-4 py-3.5 border-b border-neutral-800/50">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-neutral-500 w-[90px]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Duration
              </span>
              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((preset) => {
                    const isActive = selectedDurationPresets.includes(preset.label);
                    return (
                      <button
                        key={preset.label}
                        onClick={() => toggleDurationPreset(preset.label)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30"
                            : "bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                {selectedDurationPresets.length === 0 && (
                  <div className="flex items-center gap-3">
                    <Slider
                      value={durationMin ?? 0}
                      onChange={(val) => setDurationMin(val > 0 ? val : undefined)}
                      min={0}
                      max={1800}
                      step={30}
                      formatValue={(v) => formatDuration(v)}
                      className="flex-1"
                    />
                    <span className="text-[11px] text-neutral-600 shrink-0">to</span>
                    <Slider
                      value={durationMax ?? 1800}
                      onChange={(val) => setDurationMax(val < 1800 ? val : undefined)}
                      min={0}
                      max={1800}
                      step={30}
                      formatValue={(v) => (v >= 1800 ? "Any" : formatDuration(v))}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Row: Upload Date + Min Views ── */}
          <div className="flex items-start gap-4 px-4 py-3.5 border-b border-neutral-800/50">
            <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-neutral-500 w-[90px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Upload
            </span>
            <div className="flex flex-wrap gap-1.5">
              {UPLOAD_OPTIONS.map((opt) => {
                const isActive = uploadDate.type === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setUploadDate({ type: opt.value } as UploadDateRange)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30"
                        : "bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Row: Min Views ── */}
          <div className="flex items-start gap-4 px-4 py-3.5 border-b border-neutral-800/50">
            <span className="mt-0.5 flex shrink-0 items-center gap-1.5 text-xs font-medium text-neutral-500 w-[90px]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Views
            </span>
            <div className="flex flex-wrap gap-1.5">
              {VIEW_OPTIONS.map((opt) => {
                const isActive = minViews === opt.value;
                return (
                  <button
                    key={opt.label}
                    onClick={() => setMinViews(opt.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30"
                        : "bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Row: Keywords ── */}
          <div className="px-4 py-3.5 border-b border-neutral-800/50">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Include */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-neutral-500">Must include</span>
                <div className="flex gap-1.5">
                  <Input
                    value={includeInput}
                    onChange={(e) => setIncludeInput(e.target.value)}
                    placeholder="keyword..."
                    className="!h-8 !min-h-0 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddInclude();
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddInclude}
                    disabled={!includeInput.trim()}
                    className="!h-8 !min-h-0 whitespace-nowrap text-xs px-2.5"
                  >
                    Add
                  </Button>
                </div>
                {includeKeywords.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
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
                <span className="mb-1.5 block text-xs font-medium text-neutral-500">Exclude</span>
                <div className="flex gap-1.5">
                  <Input
                    value={excludeInput}
                    onChange={(e) => setExcludeInput(e.target.value)}
                    placeholder="keyword..."
                    className="!h-8 !min-h-0 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddExclude();
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAddExclude}
                    disabled={!excludeInput.trim()}
                    className="!h-8 !min-h-0 whitespace-nowrap text-xs px-2.5"
                  >
                    Add
                  </Button>
                </div>
                {excludeKeywords.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
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

          {/* ── Row: Max Results + Safe Search + Reset ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              {/* Max Results */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Max</span>
                <select
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  className="rounded-md border border-neutral-700 bg-neutral-800/80 px-2 py-1 text-xs text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40"
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
                description="Filter explicit"
                className="!flex-row !items-center !gap-2"
              />
            </div>

            {/* Reset */}
            {activeCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Reset all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
