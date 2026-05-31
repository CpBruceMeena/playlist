import type { UploadDateRange } from "@playlist/types";

interface UploadDateSelectProps {
  value: UploadDateRange;
  onChange: (range: UploadDateRange) => void;
}

const OPTIONS: { value: UploadDateRange["type"]; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "last_week", label: "Past week" },
  { value: "last_month", label: "Past month" },
  { value: "last_year", label: "Past year" },
];

export function UploadDateSelect({ value, onChange }: UploadDateSelectProps) {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Default custom range: last 30 days
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const defaultStart = thirtyDaysAgo.toISOString().split("T")[0];

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-300">
        Upload date
      </label>
      <div className="flex flex-wrap gap-1.5">
        {OPTIONS.map((opt) => {
          const isActive = value.type === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() =>
                onChange({ type: opt.value } as UploadDateRange)
              }
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        <span className="mx-1 self-center text-[10px] text-neutral-600">|</span>
        <button
          onClick={() =>
            onChange(
              value.type === "custom"
                ? { type: "any" }
                : { type: "custom", start: defaultStart, end: todayStr },
            )
          }
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
            value.type === "custom"
              ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom date range inputs */}
      {value.type === "custom" && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] text-neutral-500">
              From
            </label>
            <input
              type="date"
              value={value.start}
              onChange={(e) =>
                onChange({ type: "custom", start: e.target.value, end: value.end })
              }
              max={value.end}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
          <span className="mt-5 text-xs text-neutral-600">→</span>
          <div className="flex-1">
            <label className="mb-1 block text-[11px] text-neutral-500">
              To
            </label>
            <input
              type="date"
              value={value.end}
              onChange={(e) =>
                onChange({
                  type: "custom",
                  start: value.start,
                  end: e.target.value,
                })
              }
              min={value.start}
              max={todayStr}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </div>
      )}
    </div>
  );
}
