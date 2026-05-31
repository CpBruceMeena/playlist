import { type DragEvent, useCallback } from "react";
import type { YouTubeVideo } from "@playlist/types";

interface QueueItemProps {
  video: YouTubeVideo;
  index: number;
  isActive: boolean;
  isDraggable: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  position?: number;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QueueItem({
  video,
  index,
  isActive,
  isDraggable,
  isDropTarget,
  onSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
  position,
}: QueueItemProps) {
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      if (!isDraggable) return;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      e.currentTarget.classList.add("opacity-40", "ring-2", "ring-blue-500/40");
      onDragStart(index);
    },
    [index, isDraggable, onDragStart],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      onDragOver(index);
    },
    [index, onDragOver],
  );

  const handleDragEnd = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.currentTarget.classList.remove("opacity-40", "ring-2", "ring-blue-500/40");
      onDragEnd();
    },
    [onDragEnd],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.classList.remove("opacity-40", "ring-2", "ring-blue-500/40");
    },
    [],
  );

  const displayNumber = position !== undefined ? position : index + 1;

  return (
    <div className="relative">
      {/* Drop indicator line with highlight */}
      {isDropTarget && (
        <div
          className="absolute -top-px left-0 right-0 z-10"
          aria-hidden="true"
        >
          <div className="mx-2 h-0.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          <div className="mx-2 mt-[-2px] h-4 rounded-lg bg-blue-500/10" />
        </div>
      )}

      <button
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        onClick={onSelect}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-all duration-150 ${
          isActive
            ? "bg-blue-600/10 ring-1 ring-blue-500/30"
            : "hover:bg-neutral-800"
        } ${isDropTarget ? "ring-1 ring-blue-500/20" : ""} ${isDraggable ? "select-none" : ""}`}
      >
        {/* Drag handle — larger touch target */}
        {isDraggable && (
          <span
            className="flex cursor-grab items-center justify-center rounded-md p-1.5 text-neutral-600 hover:bg-neutral-800 hover:text-neutral-400 active:cursor-grabbing shrink-0 transition-colors"
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="12" x2="16" y2="12" />
              <line x1="8" y1="18" x2="16" y2="18" />
            </svg>
          </span>
        )}

        {/* Position number */}
        <span
          className={`w-5 text-center text-xs font-medium shrink-0 ${
            isActive ? "text-blue-400" : "text-neutral-500"
          }`}
        >
          {isActive ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="mx-auto text-blue-500">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            displayNumber
          )}
        </span>

        {/* Thumbnail */}
        <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded">
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.5 text-[10px] text-white">
            {formatDuration(video.durationSeconds)}
          </div>
        </div>

        {/* Video info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-neutral-200">{video.title}</p>
          <p className="truncate text-xs text-neutral-500">{video.channelTitle}</p>
        </div>
      </button>
    </div>
  );
}
