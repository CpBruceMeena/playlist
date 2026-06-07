import { useCallback, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface MergeSong {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  duration?: string;
  durationSeconds?: number;
}

interface MergeOrderDialogProps {
  songs: MergeSong[];
  /** Called when user confirms with the final ordered list + name */
  onConfirm: (ordered: MergeSong[], mergeName: string) => void;
  /** Called when user removes a song (from storage + from merge list) */
  onRemove?: (song: MergeSong) => void;
  onClose: () => void;
  /** Dialog mode — changes labels and button text */
  mode?: "merge" | "playlist";
}

const MODE_LABELS: Record<string, {
  title: string;
  subtitle: string;
  instruction: string;
  buttonText: (count: number) => string;
  skipButtonText: (count: number) => string;
  inputPlaceholder: string;
  allReadyText: (count: number) => string;
}> = {
  merge: {
    title: "Order Songs for Merge",
    subtitle: "Tap songs in the order you want them merged. Tap again to remove.",
    instruction: "The first song you tap will be the first song in the merged video. Tap songs one by one to build the order.",
    buttonText: (count) => `Merge ${count} song${count !== 1 ? "s" : ""}`,
    skipButtonText: (count) => `Skip reorder — Merge all ${count}`,
    inputPlaceholder: "Name your merged video (optional)",
    allReadyText: (count) => `All ${count} songs are in order. Ready to merge!`,
  },
  playlist: {
    title: "Order Songs for Playlist",
    subtitle: "Tap songs in the order you want them saved. Tap again to remove.",
    instruction: "The first song you tap will be the first song in the playlist. Tap songs one by one to build the order.",
    buttonText: (count) => `Save ${count} song${count !== 1 ? "s" : ""} as Playlist`,
    skipButtonText: (count) => `Skip reorder — Save all ${count}`,
    inputPlaceholder: "Name your playlist (optional)",
    allReadyText: (count) => `All ${count} songs are in order. Ready to save!`,
  },
};

export function MergeOrderDialog({
  songs: initialSongs,
  onConfirm,
  onRemove,
  onClose,
  mode = "merge",
}: MergeOrderDialogProps) {
  // ordered: list of songs in the order the user tapped them
  const [ordered, setOrdered] = useState<MergeSong[]>([]);
  const [mergeName, setMergeName] = useState("");
  // Track which songs were removed from storage
  const storageRemovedIdsRef = useRef<Set<string>>(new Set());

  const orderedIds = new Set(ordered.map((s) => s.videoId));

  const handleTileTap = useCallback((song: MergeSong) => {
    setOrdered((prev) => {
      const idx = prev.findIndex((s) => s.videoId === song.videoId);
      if (idx !== -1) {
        // Remove from order (deselect)
        return prev.filter((s) => s.videoId !== song.videoId);
      }
      // Add to end of order (select)
      return [...prev, song];
    });
  }, []);

  const handleRemoveFromStorage = useCallback(
    (e: React.MouseEvent, song: MergeSong) => {
      e.stopPropagation();
      storageRemovedIdsRef.current.add(song.videoId);
      setOrdered((prev) => prev.filter((s) => s.videoId !== song.videoId));
      onRemove?.(song);
    },
    [onRemove],
  );

  const handleResetOrder = useCallback(() => {
    setOrdered(
      initialSongs.filter((s) => !storageRemovedIdsRef.current.has(s.videoId)),
    );
  }, [initialSongs]);

  const handleConfirm = useCallback(() => {
    const name = mergeName.trim() || `Merged (${ordered.length} songs)`;
    onConfirm(ordered, name);
  }, [ordered, mergeName, onConfirm]);

  const handleSkipReorder = useCallback(() => {
    const available = initialSongs.filter(
      (s) => !storageRemovedIdsRef.current.has(s.videoId),
    );
    const name = mergeName.trim() || `Merged (${available.length} songs)`;
    onConfirm(available, name);
  }, [initialSongs, mergeName, onConfirm]);

  const minCount = mode === "playlist" ? 1 : 2;
  const selectedCount = ordered.length;
  const availableCount = initialSongs.filter(
    (s) => !storageRemovedIdsRef.current.has(s.videoId),
  ).length;
  const unselected = initialSongs.filter(
    (s) =>
      !orderedIds.has(s.videoId) &&
      !storageRemovedIdsRef.current.has(s.videoId),
  );

  const labels = MODE_LABELS[mode];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-neutral-800 px-5 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {labels.title}
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                {labels.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
                {selectedCount} of {initialSongs.length} selected
              </span>
              {/* Close button */}
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
                aria-label="Cancel merge"
                title="Cancel merge"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Instructions */}
          <div className="mb-4 rounded-lg border border-blue-900/40 bg-blue-950/30 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-400"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p className="text-xs text-blue-300/80">
                <strong className="text-blue-200">{labels.instruction}</strong>
              </p>
            </div>
          </div>

          {/* Ordered tiles (selected songs) */}
          {selectedCount > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Your Order
                  <span className="ml-1.5 rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-normal text-blue-400">
                    {selectedCount}
                  </span>
                </h3>
                <button
                  onClick={handleResetOrder}
                  className="text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300"
                >
                  Reset order
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ordered.map((song) => (
                  <div key={song.id} className="relative group">
                    <button
                      onClick={() => handleTileTap(song)}
                      className="relative flex h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-blue-500 bg-neutral-800 transition-all duration-150 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      {/* Thumbnail */}
                      {song.thumbnailUrl ? (
                        <img
                          src={song.thumbnailUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-60"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-blue-400/40"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}

                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Title */}
                      <span className="relative z-10 mt-2 max-w-[80px] truncate text-[11px] font-medium text-white drop-shadow-lg">
                        {song.title}
                      </span>
                    </button>

                    {/* Delete from My Songs */}
                    <button
                      onClick={(e) => handleRemoveFromStorage(e, song)}
                      className="absolute -right-1.5 -top-1.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity duration-150 hover:bg-red-400 group-hover:opacity-100"
                      aria-label={`Delete ${song.title} from My Songs`}
                      title="Remove from My Songs"
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All songs selected state */}
          {unselected.length === 0 && selectedCount > 0 && (
            <div className="mb-4 rounded-lg border border-green-900/30 bg-green-950/20 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-green-400"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-xs text-green-300">
                  {labels.allReadyText(selectedCount)}
                </p>
              </div>
            </div>
          )}

          {/* Available tiles (unselected songs) */}
          {unselected.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Tap to add
                <span className="ml-1.5 rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px] font-normal text-neutral-500">
                  {unselected.length}
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {unselected.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handleTileTap(song)}
                    className="relative flex h-24 w-24 flex-col items-center justify-center overflow-hidden rounded-xl border border-neutral-700 bg-neutral-800/80 transition-all duration-150 hover:border-blue-500/40 hover:bg-neutral-800"
                  >
                    {/* Thumbnail */}
                    {song.thumbnailUrl ? (
                      <img
                        src={song.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-40"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-700 to-neutral-800">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-neutral-500/30"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}

                    {/* Dark overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Add indicator */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="relative z-10 text-neutral-400 transition-colors group-hover:text-blue-400"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>

                    {/* Title */}
                    <span className="relative z-10 mt-1 max-w-[80px] truncate text-[10px] font-medium text-neutral-400">
                      {song.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {selectedCount === 0 && unselected.length === 0 && (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900/50 py-8">
              <p className="text-xs text-neutral-500">
                No songs available to order
              </p>
            </div>
          )}
        </div>

        {/* Footer — sticky */}
        <div className="shrink-0 border-t border-neutral-800 px-5 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex-1">
              <Input
                value={mergeName}
                onChange={(e) => setMergeName(e.target.value)}
                placeholder={labels.inputPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selectedCount >= minCount) handleConfirm();
                  if (e.key === "Escape") onClose();
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipReorder}
                disabled={availableCount < minCount}
                className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:border-neutral-600 hover:bg-neutral-700/50 hover:text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {labels.skipButtonText(availableCount)}
              </button>
              <Button onClick={handleConfirm} disabled={selectedCount < minCount}>
                {labels.buttonText(selectedCount)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
