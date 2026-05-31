import { useFilterStore } from "../../stores/filterStore";

function formatRange(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined) return `${min / 60}-${max / 60} min`;
  if (min !== undefined) return `>${min / 60} min`;
  if (max !== undefined) return `<${max / 60} min`;
  return null;
}

const UPLOAD_LABELS: Record<string, string> = {
  last_week: "Past week",
  last_month: "Past month",
  last_year: "Past year",
};

export function ActiveFilterBar() {
  const {
    isExpanded,
    durationMin,
    durationMax,
    videoTypes,
    includeKeywords,
    excludeKeywords,
    uploadDate,
    minViews,
    maxResults,
    safeSearch,
    togglePanel,
    getActiveFilterCount,
  } = useFilterStore();

  const activeCount = getActiveFilterCount();

  // Don't render if panel is expanded (filters are visible) or no filters active
  if (isExpanded || activeCount === 0) return null;

  const chips: { label: string; key: string }[] = [];

  if (durationMin !== undefined || durationMax !== undefined) {
    const range = formatRange(durationMin, durationMax);
    if (range) chips.push({ label: `Duration: ${range}`, key: "duration" });
  }

  if (videoTypes.length < 4) {
    const typeStr = videoTypes
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(", ");
    chips.push({ label: `Type: ${typeStr}`, key: "types" });
  }

  if (uploadDate.type !== "any") {
    chips.push({
      label: `Upload: ${UPLOAD_LABELS[uploadDate.type] ?? uploadDate.type}`,
      key: "upload",
    });
  }

  if (includeKeywords.length > 0) {
    chips.push({
      label: `Include: ${includeKeywords.join(", ")}`,
      key: "include",
    });
  }

  if (excludeKeywords.length > 0) {
    chips.push({
      label: `Exclude: ${excludeKeywords.join(", ")}`,
      key: "exclude",
    });
  }

  if (minViews !== undefined) {
    const viewLabel = minViews >= 1000000 ? `${minViews / 1000000}M+` : minViews >= 1000 ? `${minViews / 1000}K+` : `${minViews}+`;
    chips.push({ label: `Views: ${viewLabel}`, key: "views" });
  }

  if (maxResults !== 25) {
    chips.push({ label: `Max: ${maxResults}`, key: "max" });
  }

  if (!safeSearch) {
    chips.push({ label: "Safe search off", key: "safe" });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/30 px-3 py-2">
      <span className="text-xs font-medium text-neutral-500 shrink-0">
        Active filters:
      </span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center rounded-md bg-blue-600/10 px-2 py-0.5 text-xs text-blue-400"
        >
          {chip.label}
        </span>
      ))}
      <button
        onClick={togglePanel}
        className="ml-auto text-xs text-blue-500 transition-colors hover:text-blue-400 shrink-0"
      >
        Edit
      </button>
    </div>
  );
}
