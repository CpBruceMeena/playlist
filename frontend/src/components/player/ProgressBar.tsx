import { useCallback, useRef } from "react";

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
}

export function ProgressBar({ currentTime, duration, onSeek }: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current || duration <= 0) return;
      const rect = barRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      onSeek(percentage * duration);
    },
    [duration, onSeek],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (duration <= 0) return;
      const step = duration > 600 ? 10 : 5; // 10s for long videos, 5s otherwise
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onSeek(Math.min(currentTime + step, duration));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSeek(Math.max(currentTime - step, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        onSeek(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onSeek(duration);
      }
    },
    [currentTime, duration, onSeek],
  );

  if (duration <= 0) return null;

  const progress = Math.min((currentTime / duration) * 100, 100);

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group relative h-1.5 cursor-pointer rounded-full bg-neutral-800 overflow-hidden transition-all hover:h-2"
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={Math.floor(duration)}
      aria-valuenow={Math.floor(currentTime)}
      aria-valuetext={`${Math.floor(currentTime / 60)}:${String(Math.floor(currentTime % 60)).padStart(2, "0")} of ${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`}
      tabIndex={0}
    >
      {/* Progress fill */}
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
      {/* Hover/seek indicator */}
      <div className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/5 transition-colors" />
    </div>
  );
}
