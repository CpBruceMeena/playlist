import { Slider } from "../ui/Slider";

interface DurationSliderProps {
  durationMin: number | undefined;
  durationMax: number | undefined;
  onDurationMinChange: (seconds: number | undefined) => void;
  onDurationMaxChange: (seconds: number | undefined) => void;
}

const DURATION_PRESETS = [
  { label: "Any", min: undefined, max: undefined },
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
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function DurationSlider({
  durationMin,
  durationMax,
  onDurationMinChange,
  onDurationMaxChange,
}: DurationSliderProps) {
  const activePreset = DURATION_PRESETS.find(
    (p) => p.min === durationMin && p.max === durationMax,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-300">Duration</label>
        <span className="text-xs text-neutral-500">
          {durationMin !== undefined || durationMax !== undefined
            ? `${formatDuration(durationMin)} — ${formatDuration(durationMax)}`
            : "Any length"}
        </span>
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {DURATION_PRESETS.map((preset) => {
          const isActive = preset.min === durationMin && preset.max === durationMax;
          return (
            <button
              key={preset.label}
              onClick={() => {
                onDurationMinChange(preset.min);
                onDurationMaxChange(preset.max);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom range sliders */}
      <div className="space-y-3 pt-2">
        <Slider
          label="Min duration"
          value={durationMin ?? 0}
          onChange={(val) => onDurationMinChange(val > 0 ? val : undefined)}
          min={0}
          max={1800}
          step={30}
          formatValue={(v) => formatDuration(v)}
        />
        <Slider
          label="Max duration"
          value={durationMax ?? 1800}
          onChange={(val) => onDurationMaxChange(val < 1800 ? val : undefined)}
          min={0}
          max={1800}
          step={30}
          formatValue={(v) => (v >= 1800 ? "Any" : formatDuration(v))}
        />
      </div>
    </div>
  );
}
