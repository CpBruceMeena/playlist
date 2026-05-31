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

const VIEW_LABELS: Record<number, string> = {
  1000: "1K+",
  10000: "10K+",
  100000: "100K+",
  1000000: "1M+",
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
  } = useFilterStore();

  // Don't render when the panel is already expanded
  if (isExpanded) return null;

  const chips: { label: string; key: string }[] = [];

  // Default-on states
  if (videoTypes.length === 4) {
    chips.push({ label: "All types", key: "types-all" });
  } else if (videoTypes.length < 4) {
    const typeStr = videoTypes
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
      .join(", ");
    chips.push({ label: `Type: ${typeStr}`, key: "types" });
  }

  if (safeSearch) {
    chips.push({ label: "Safe: On", key: "safe-on" });
  }

  // Non-default states
  if (durationMin !== undefined || durationMax !== undefined) {
    const range = formatRange(durationMin, durationMax);
    if (range) chips.push({ label: `Duration: ${range}`, key: "duration" });
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
    const viewLabel = VIEW_LABELS[minViews] ?? `${minViews}+`;
    chips.push({ label: `Views: ${viewLabel}`, key: "views" });
  }

  if (maxResults !== 25) {
    chips.push({ label: `Max: ${maxResults}`, key: "max" });
  }

  if (!safeSearch) {
    chips.push({ label: "Safe search off", key: "safe-off" });
  }

  if (chips.length === 0) return null;

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center rounded-full border border-neutral-700/50 bg-neutral-800/40 px-2 py-0.5 text-xs font-medium text-neutral-400"
        >
          {chip.label}
        </span>
      ))}
      <button
        onClick={togglePanel}
        className="text-xs font-medium text-blue-500/70 transition-colors hover:text-blue-400"
      >
        Edit
      </button>
    </div>
  );
}
