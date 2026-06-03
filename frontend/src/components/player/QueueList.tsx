import { useCallback, useRef, useState } from "react";
import { usePlayerStore } from "../../stores/playerStore";
import { toast } from "../../stores/toastStore";
import { QueueItem } from "./QueueItem";

export function QueueList() {
  const {
    queue,
    currentIndex,
    setCurrentIndex,
    reorderQueue,
  } = usePlayerStore();

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Track drag state in state to avoid accessing ref during render
  const [dragState, setDragState] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
    setDragState(index);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => {
      if (dragIndexRef.current === null || dragIndexRef.current === index) return;
      setDragOverIndex(index);
      reorderQueue(dragIndexRef.current, index);
      dragIndexRef.current = index;
    },
    [reorderQueue],
  );

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
    setDragState(null);
    setDragOverIndex(null);
  }, []);

  if (queue.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-neutral-600">
        No videos in queue
      </div>
    );
  }

  return (
    <div className="p-2">
      {queue.map((video, index) => (
        <QueueItem
          key={`${video.id}-${index}`}
          video={video}
          index={index}
          isActive={index === currentIndex}
          isDraggable={queue.length > 1}
          isDropTarget={
            dragOverIndex === index && dragState !== index
          }

          onSelect={() => setCurrentIndex(index)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}

interface QueueHeaderProps {
  count: number;
  shuffleMode: boolean;
  repeatMode: "none" | "all";
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export function QueueHeader({
  count,
  shuffleMode,
  repeatMode,
  onToggleShuffle,
  onToggleRepeat,
}: QueueHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
      <h2 className="flex items-center gap-2 text-sm font-medium text-neutral-300">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
        Queue
        <span className="ml-auto text-xs text-neutral-500">
          {count} videos
        </span>
      </h2>

      {/* Shuffle & Repeat controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            onToggleShuffle();
            toast(shuffleMode ? "Shuffle disabled" : "Queue shuffled", "info", 2000);
          }}
          className={`rounded-lg p-1.5 transition-colors ${
            shuffleMode
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
          aria-label={shuffleMode ? "Disable shuffle" : "Enable shuffle"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
        </button>
        <button
          onClick={onToggleRepeat}
          className={`rounded-lg p-1.5 transition-colors ${
            repeatMode !== "none"
              ? "text-blue-500"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
          aria-label={
            repeatMode === "all" ? "Disable repeat" : "Enable repeat all"
          }
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
