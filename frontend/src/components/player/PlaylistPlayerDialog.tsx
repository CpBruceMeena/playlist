import { useState, useEffect, useCallback, useRef, memo } from "react";
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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [videoHeight, setVideoHeight] = useState(0);
  const queueRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, videos.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleEnd = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, videos.length]);

  const { loadVideo, isReady } = useSimplePlayer({
    containerId: PLAYER_CONTAINER_ID,
    onEnd: handleEnd,
  });

  // Load video when currentIndex changes or player becomes ready
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
  }, [currentIndex]);

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
          handleNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          handlePrevious();
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNext, handlePrevious]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!currentVideo) return null;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < videos.length - 1;

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
                {currentIndex + 1} of {videos.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Previous */}
            <button
              onClick={handlePrevious}
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
              onClick={handleNext}
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
                {videos.length > 1 ? `${videos.length} videos` : "1 video"}
              </p>
            </div>

            {/* Scrollable queue items */}
            <div ref={queueRef} className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-0.5 p-2">
                {videos.map((video, i) => (
                  <div key={`${video.id}-${i}`} data-active={i === currentIndex}>
                    <QueueItemTile
                      item={video}
                      isActive={i === currentIndex}
                      onClick={() => setCurrentIndex(i)}
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
