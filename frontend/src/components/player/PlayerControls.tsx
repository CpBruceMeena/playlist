import { useEffect } from "react";
import { Button } from "../ui/Button";
import { usePlayerStore } from "../../stores/playerStore";
import { toast } from "../../stores/toastStore";

interface PlayerControlsProps {
  isPlaying: boolean;
  isReady: boolean;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
}

const SHORTCUT_HINTS = [
  { key: "Space", label: "Play/Pause" },
  { key: "N", label: "Next" },
  { key: "P", label: "Previous" },
  { key: "M", label: "Mute" },
  { key: "←/→", label: "Seek" },
] as const;

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerControls({
  isPlaying,
  isReady,
  currentTime,
  duration,
  onSeek,
  onTogglePlay,
}: PlayerControlsProps) {
  const {
    next,
    previous,
    shuffleMode,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    volume,
    setVolume,
    isMuted,
    toggleMute,
  } = usePlayerStore();

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (isReady) onTogglePlay();
          break;
        case "n":
        case "N":
          e.preventDefault();
          next();
          break;
        case "p":
        case "P":
          e.preventDefault();
          previous();
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onSeek(Math.max(currentTime - (duration > 600 ? 10 : 5), 0));
          break;
        case "ArrowRight":
          e.preventDefault();
          onSeek(Math.min(currentTime + (duration > 600 ? 10 : 5), duration));
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, next, previous, toggleMute, currentTime, duration, onSeek, isReady]);

  return (
    <div className="space-y-2">
      {/* Main controls row */}
      <div className="flex items-center justify-center gap-2">
        {/* Shuffle */}
        <button
          onClick={() => {
            toggleShuffle();
            toast(shuffleMode ? "Shuffle disabled" : "Queue shuffled", "info", 2000);
          }}
          className={`rounded-lg p-2 transition-colors ${
            shuffleMode
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
          aria-label={shuffleMode ? "Disable shuffle" : "Enable shuffle"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>

        {/* Previous */}
        <button
          onClick={previous}
          className="rounded-lg p-2 text-neutral-400 transition-colors hover:text-white"
          aria-label="Previous video"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Play/Pause */}
        <Button
          onClick={onTogglePlay}
          variant="primary"
          size="md"
          className="h-12 w-12 rounded-full p-0"
          disabled={!isReady}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </Button>

        {/* Next */}
        <button
          onClick={next}
          className="rounded-lg p-2 text-neutral-400 transition-colors hover:text-white"
          aria-label="Next video"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        {/* Repeat */}
        <button
          onClick={toggleRepeat}
          className={`rounded-lg p-2 transition-colors ${
            repeatMode !== "none"
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
          aria-label={
            repeatMode === "all" ? "Disable repeat" : "Enable repeat all"
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
      </div>

      {/* Volume and time row */}
      <div className="flex items-center justify-between gap-4">
        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-neutral-500 transition-colors hover:text-neutral-300"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMuted || volume === 0 ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              )}
            </svg>
          </button>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-neutral-700 outline-none
                [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150
                [&::-webkit-slider-thumb]:hover:scale-125
                [&::-webkit-slider-thumb]:active:scale-90
                [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
                [&::-moz-range-thumb]:shadow-md
                [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-neutral-700"
              aria-label="Volume"
            />
            {/* Volume level fill */}
            <div
              className="pointer-events-none absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-blue-500/30 transition-all duration-100"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
          </div>
        </div>

        {/* Time */}
        <div className="text-xs text-neutral-500 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="flex items-center justify-center gap-3">
        {SHORTCUT_HINTS.map((hint) => (
          <span key={hint.key} className="inline-flex items-center gap-1 text-[10px] text-neutral-600">
            <kbd className="rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
              {hint.key}
            </kbd>
            <span>{hint.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
