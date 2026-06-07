import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { useSimplePlayer } from "../../hooks/useSimplePlayer";

const PLAYER_CONTAINER_ID = "playlist-player-container";

interface QueueVideo {
  id: string;
  title: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

interface PlaylistPlayerDialogProps {
  videos: QueueVideo[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const QueueItemTile = memo(function QueueItemTile({
  item,
  isActive,
  onClick,
}: {
  item: QueueVideo;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full gap-2 rounded-lg p-2 text-left text-xs transition-all duration-150 ${
        isActive
          ? "bg-blue-600/20 ring-1 ring-blue-500/40"
          : "hover:bg-white/5"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-800">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-600">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
        {/* Active indicator */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-600/30">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <polygon points="8,5 8,19 19,12" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <p className={`truncate font-medium leading-tight ${isActive ? "text-blue-300" : "text-neutral-300"}`}>
          {item.title}
        </p>
        {item.durationSeconds ? (
          <span className="text-[10px] text-neutral-500">{formatDuration(item.durationSeconds)}</span>
        ) : null}
      </div>
    </button>
  );
});

export function PlaylistPlayerDialog({ videos, initialIndex = 0, title, onClose }: PlaylistPlayerDialogProps) {
  // ── Playback order ──
  const sequentialOrder = useMemo(() => videos.map((_, i) => i), [videos]);
  const [playOrder, setPlayOrder] = useState<number[]>(sequentialOrder);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(initialIndex);
  const [shuffled, setShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all">("none");

  const currentVideoIndex = playOrder[currentPlayIndex];
  const currentVideo = videos[currentVideoIndex];

  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [videoHeight, setVideoHeight] = useState(0);
  const queueRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // ── Navigation ──

  const goNext = useCallback(() => {
    if (currentPlayIndex < playOrder.length - 1) {
      setCurrentPlayIndex((i) => i + 1);
    } else if (repeatMode === "all") {
      setCurrentPlayIndex(0);
    }
  }, [currentPlayIndex, playOrder.length, repeatMode]);

  const goPrev = useCallback(() => {
    if (currentPlayIndex > 0) {
      setCurrentPlayIndex((i) => i - 1);
    } else if (repeatMode === "all") {
      setCurrentPlayIndex(playOrder.length - 1);
    }
  }, [currentPlayIndex, repeatMode, playOrder.length]);

  // ── Shuffle ──

  const handleToggleShuffle = useCallback(() => {
    if (shuffled) {
      // Restore sequential order, keep current position
      setPlayOrder(sequentialOrder);
      setCurrentPlayIndex(currentVideoIndex);
      setShuffled(false);
    } else {
      // Shuffle: keep current video at front, randomize the rest
      const rest = sequentialOrder.filter((i) => i !== currentVideoIndex);
      setPlayOrder([currentVideoIndex, ...shuffleArray(rest)]);
      setCurrentPlayIndex(0);
      setShuffled(true);
    }
  }, [shuffled, sequentialOrder, currentVideoIndex]);

  // ── Repeat ──

  const handleToggleRepeat = useCallback(() => {
    setRepeatMode((prev) => (prev === "none" ? "all" : "none"));
  }, []);

  // ── End handler ──

  const handleEnd = useCallback(() => {
    if (currentPlayIndex < playOrder.length - 1) {
      setCurrentPlayIndex((i) => i + 1);
    } else if (repeatMode === "all") {
      setCurrentPlayIndex(0);
    }
  }, [currentPlayIndex, playOrder.length, repeatMode]);

  // ── Player ──

  const { loadVideo, isReady } = useSimplePlayer({
    containerId: PLAYER_CONTAINER_ID,
    onEnd: handleEnd,
  });

  // Load video when current changes or player becomes ready
  useEffect(() => {
    if (currentVideo && isReady) {
      loadVideo(currentVideo.id);
    }
  }, [currentVideo, loadVideo, isReady]);

  // Sync queue height to match video height
  useEffect(() => {
    const videoEl = videoContainerRef.current;
    if (!videoEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setVideoHeight(entry.contentRect.height);
      }
    });

    observer.observe(videoEl);
    setVideoHeight(videoEl.offsetHeight);

    return () => observer.disconnect();
  }, []);

  // Auto-scroll queue to active item
  useEffect(() => {
    if (queueRef.current) {
      const activeItem = queueRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [currentPlayIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          goPrev();
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!currentVideo) return null;

  const hasPrevious = currentPlayIndex > 0 || repeatMode === "all";
  const hasNext = currentPlayIndex < playOrder.length - 1 || repeatMode === "all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full max-h-[95vh] w-full max-w-7xl flex-col gap-3 animate-in zoom-in-95 duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white/80">
                {title ?? "Now Playing"}
              </p>
              <p className="truncate text-[11px] text-neutral-500">
                {currentPlayIndex + 1} of {playOrder.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Shuffle */}
            <button
              onClick={handleToggleShuffle}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                shuffled
                  ? "text-blue-400 bg-blue-500/15 hover:bg-blue-500/25"
                  : "text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
              aria-label={shuffled ? "Disable shuffle" : "Enable shuffle"}
              title={shuffled ? "Shuffle on" : "Shuffle off"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={goPrev}
              disabled={!hasPrevious}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                hasPrevious
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-neutral-700 cursor-not-allowed"
              }`}
              aria-label="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Next */}
            <button
              onClick={goNext}
              disabled={!hasNext}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                hasNext
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-neutral-700 cursor-not-allowed"
              }`}
              aria-label="Next"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={handleToggleRepeat}
              className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                repeatMode === "all"
                  ? "text-blue-400 bg-blue-500/15 hover:bg-blue-500/25"
                  : "text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
              aria-label={repeatMode === "all" ? "Disable repeat all" : "Enable repeat all"}
              title={repeatMode === "all" ? "Repeat all on" : "Repeat all off"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              {repeatMode === "all" && (
                <span className="absolute -bottom-0.5 text-[7px] font-bold text-blue-400">1</span>
              )}
            </button>

            {/* Toggle queue panel (for mobile) */}
            <button
              onClick={() => setIsQueueOpen((o) => !o)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-all hover:bg-white/10 hover:text-white sm:hidden"
              aria-label={isQueueOpen ? "Hide queue" : "Show queue"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main content area — items-start so queue height matches video */}
        <div className="flex flex-1 gap-3 overflow-hidden items-start">
          {/* Video player */}
          <div
            ref={videoContainerRef}
            className="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-black shadow-2xl"
          >
            <div className="aspect-video w-full">
              <div
                id={PLAYER_CONTAINER_ID}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>

          {/* Queue sidebar — height matches video player */}
          <div
            className={`hidden sm:flex w-72 shrink-0 flex-col rounded-xl border border-neutral-800 bg-neutral-900/80 backdrop-blur-sm overflow-hidden ${
              isQueueOpen ? "" : "hidden"
            }`}
            style={{
              height: videoHeight > 0 ? videoHeight : "auto",
            }}
          >
            {/* Queue header — sticky within the queue */}
            <div className="shrink-0 border-b border-neutral-800 bg-neutral-900/90 px-3 py-2.5">
              <p className="text-xs font-semibold text-neutral-300">Up Next</p>
              <p className="text-[10px] text-neutral-600">
                {playOrder.length > 1 ? `${playOrder.length} videos` : "1 video"}
                {shuffled && (
                  <span className="ml-1.5 text-blue-400">· shuffled</span>
                )}
                {repeatMode === "all" && (
                  <span className="ml-1.5 text-blue-400">· repeat all</span>
                )}
              </p>
            </div>

            {/* Scrollable queue items */}
            <div ref={queueRef} className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-0.5 p-2">
                {videos.map((video, i) => (
                  <div key={`${video.id}-${i}`} data-active={currentVideoIndex === i}>
                    <QueueItemTile
                      item={video}
                      isActive={currentVideoIndex === i}
                      onClick={() => {
                        const pos = playOrder.indexOf(i);
                        if (pos !== -1) setCurrentPlayIndex(pos);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
