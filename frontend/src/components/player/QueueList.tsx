import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../stores/playerStore";
import { useSavedSongsStore } from "../../stores/savedSongsStore";
import { useToastStore, toast } from "../../stores/toastStore";
import { QueueItem } from "./QueueItem";
import { Button } from "../ui/Button";
import { MergeOrderDialog } from "../processing/MergeOrderDialog";
import { startMerge } from "../../api/mergeRunner";

interface QueueListProps {
  isSelecting?: boolean;
  onToggleSelect?: () => void;
}

export function QueueList({ isSelecting = false, onToggleSelect }: QueueListProps) {
  const {
    queue,
    currentIndex,
    setCurrentIndex,
    reorderQueue,
  } = usePlayerStore();
  const addSongs = useSavedSongsStore((s) => s.addSongs);
  const addToast = useToastStore((s) => s.addToast);

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragState, setDragState] = useState<number | null>(null);

  // Merge order dialog state
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  // Selection state (managed internally)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedCount = selectedIds.length;

  // Clear selections when exiting selection mode
  useEffect(() => {
    if (!isSelecting) {
      setSelectedIds([]);
    }
  }, [isSelecting]);

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

  const toggleSelect = useCallback((videoId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter((id) => id !== videoId);
      }
      return [...prev, videoId];
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(queue.map((v) => v.id));
  }, [queue]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const navigate = useNavigate();

  const handleSaveSelected = useCallback(() => {
    const videosToSave = queue.filter((v) => selectedIds.includes(v.id));
    if (videosToSave.length === 0) return;

    const result = addSongs(videosToSave);
    if ("error" in result) {
      addToast({ message: result.error, type: "error", duration: 4000 });
      return;
    }

    addToast({
      message: `Saved ${videosToSave.length} song${videosToSave.length !== 1 ? "s" : ""} to My Songs`,
      type: "success",
      duration: 3000,
    });

    // Exit selection mode after saving
    onToggleSelect?.();
  }, [queue, selectedIds, addSongs, addToast, onToggleSelect]);

  const handleMergeDialogConfirm = useCallback(
    (ordered: { id: string; videoId: string; title: string; thumbnailUrl?: string }[]) => {
      setShowMergeDialog(false);

      startMerge(
        ordered.map((s) => ({ id: s.videoId, title: s.title })),
        navigate,
      );
      onToggleSelect?.();
    },
    [navigate, onToggleSelect],
  );

  const handleMergeSelected = useCallback(() => {
    const videosToMerge = queue.filter((v) => selectedIds.includes(v.id));
    if (videosToMerge.length < 2) {
      addToast({ message: "Select at least 2 songs to merge", type: "error", duration: 3000 });
      return;
    }

    setShowMergeDialog(true);
  }, [queue, selectedIds, addToast]);

  if (queue.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-neutral-600">
        No videos in queue
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Selection controls */}        {isSelecting && (
        <div className="mb-2 flex items-center justify-between border-b border-neutral-800 px-1 pb-2">
          <span className="text-xs text-neutral-400">
            {selectedCount > 0
              ? `${selectedCount} selected`
              : "Select videos to save or merge"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={selectedCount === queue.length ? deselectAll : selectAll}
              className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              {selectedCount === queue.length ? "Deselect all" : "Select all"}
            </button>
            <button
              onClick={onToggleSelect}
              className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Queue items */}
      {queue.map((video, index) => (
        <QueueItem
          key={`${video.id}-${index}`}
          video={video}
          index={index}
          isActive={index === currentIndex}
          isDraggable={!isSelecting && queue.length > 1}
          isDropTarget={
            dragOverIndex === index && dragState !== index
          }
          isSelectable={isSelecting}
          isSelected={selectedIds.includes(video.id)}
          onSelect={() => {
            if (isSelecting) return; // Don't play when selecting
            setCurrentIndex(index);
          }}
          onToggleSelect={() => toggleSelect(video.id)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      ))}

      {/* Floating save bar */}
      {isSelecting && selectedCount > 0 && (
        <div className="sticky bottom-2 mt-3 rounded-xl border border-blue-900/40 bg-blue-950/80 px-4 py-3 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-200">
              {selectedCount} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={deselectAll}>
                Clear
              </Button>
              <Button size="sm" variant="secondary" onClick={handleSaveSelected}>
                Save
              </Button>
              <Button size="sm" onClick={handleMergeSelected}>
                Merge
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Merge order dialog */}
      {showMergeDialog && (
        <MergeOrderDialog
          songs={queue
            .filter((v) => selectedIds.includes(v.id))
            .map((v) => ({
              id: v.id,
              videoId: v.id,
              title: v.title,
              thumbnailUrl: v.thumbnailUrl,
              duration: v.duration,
              durationSeconds: v.durationSeconds,
            }))}
          onConfirm={handleMergeDialogConfirm}
          onClose={() => setShowMergeDialog(false)}
        />
      )}

    </div>
  );
}

interface QueueHeaderProps {
  count: number;
  shuffleMode: boolean;
  repeatMode: "none" | "all";
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  isSelecting?: boolean;
  onToggleSelect?: () => void;
}

export function QueueHeader({
  count,
  shuffleMode,
  repeatMode,
  onToggleShuffle,
  onToggleRepeat,
  isSelecting,
  onToggleSelect,
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

      {/* Select + Shuffle & Repeat controls */}
      <div className="flex items-center gap-1">
        {onToggleSelect && (
          <button
            onClick={onToggleSelect}
            className={`rounded-lg p-1.5 transition-colors ${
              isSelecting
                ? "text-blue-500"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
            aria-label={isSelecting ? "Cancel selection" : "Select songs"}
            title={isSelecting ? "Cancel selection" : "Select songs to save or merge"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </button>
        )}
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
