import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "../../stores/playerStore";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const navigate = useNavigate();
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const videoDuration = usePlayerStore((s) => s.videoDuration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const playingMergedVideo = usePlayerStore((s) => s.playingMergedVideo);
  const setPlayingMergedVideo = usePlayerStore((s) => s.setPlayingMergedVideo);
  const mergedVideoCurrentTime = usePlayerStore((s) => s.mergedVideoCurrentTime);
  const setMergedVideoCurrentTime = usePlayerStore((s) => s.setMergedVideoCurrentTime);
  const mergedQueue = usePlayerStore((s) => s.mergedQueue);
  const playNextMerged = usePlayerStore((s) => s.playNextMerged);

  const currentVideo = queue[currentIndex];
  const isYouTubePlaying = queue.length > 0 && currentIndex >= 0;
  const isMergedPlaying = playingMergedVideo !== null;

  const hasContent = isYouTubePlaying || isMergedPlaying;

  // ── Merged video local playback state ──
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mergedPlaying, setMergedPlaying] = useState(isMergedPlaying);
  const [mergedCurrentTime, setMergedCurrentTime] = useState(0);
  const [mergedDuration, setMergedDuration] = useState(0);

  // Restore playback position on mount
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !isMergedPlaying) return;
    if (mergedVideoCurrentTime > 0) {
      el.currentTime = mergedVideoCurrentTime;
    }
  }, [isMergedPlaying]);

  // Update time for merged video + persist to store
  useEffect(() => {
    if (!isMergedPlaying || !videoRef.current) return;
    const interval = setInterval(() => {
      if (videoRef.current) {
        const t = videoRef.current.currentTime;
        setMergedCurrentTime(t);
        setMergedVideoCurrentTime(t);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isMergedPlaying]);

  // Save position on unmount
  useEffect(() => {
    return () => {
      const el = videoRef.current;
      if (el && el.currentTime > 0) {
        setMergedVideoCurrentTime(el.currentTime);
      }
    };
  }, []);

  // Sync play/pause for merged video (follows user toggle)
  useEffect(() => {
    if (!videoRef.current || !isMergedPlaying) return;
    if (mergedPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [mergedPlaying, isMergedPlaying]);

  const mergedProgress =
    mergedDuration > 0 ? (mergedCurrentTime / mergedDuration) * 100 : 0;

  const toggleMergedPlay = useCallback(() => {
    setMergedPlaying((p) => !p);
  }, []);

  const handleCloseMerged = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setPlayingMergedVideo(null);
  }, [setPlayingMergedVideo]);

  const handleMergedTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setMergedCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleMergedLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setMergedDuration(videoRef.current.duration || 0);
    }
  }, []);

  const handleMergedEnded = useCallback(() => {
    setMergedPlaying(false);
    setMergedCurrentTime(0);
    setMergedVideoCurrentTime(0);
    // Auto-advance to next merged video in queue
    if (mergedQueue.length > 0) {
      playNextMerged();
    }
  }, [setMergedVideoCurrentTime, mergedQueue.length, playNextMerged]);

  // Undo-friendly close for YouTube
  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearQueue();
    },
    [clearQueue],
  );

  if (!hasContent) return null;

  // ── Merged video MiniPlayer ──
  if (isMergedPlaying && playingMergedVideo) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:pl-56">
        {/* Progress bar */}
        <div className="h-[2px] w-full bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-linear"
            style={{ width: `${Math.min(mergedProgress, 100)}%` }}
          />
        </div>

        {/* Hidden <video> for audio playback */}
        <video
          ref={videoRef}
          src={playingMergedVideo.videoUrl}
          preload="auto"
          playsInline
          className="pointer-events-none fixed -left-[9999px] opacity-0"
          onTimeUpdate={handleMergedTimeUpdate}
          onLoadedMetadata={handleMergedLoadedMetadata}
          onEnded={handleMergedEnded}
          onPlay={() => setMergedPlaying(true)}
          onPause={() => setMergedPlaying(false)}
        />

        {/* Main bar */}
        <div className="flex items-center gap-2 border-t border-neutral-800 bg-neutral-950/95 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-3">
          {/* Clickable: thumbnail + info */}
          <button
            onClick={() => navigate("/merged-videos")}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            {/* Thumbnail */}
            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
              {playingMergedVideo.thumbnailUrl ? (
                <img
                  src={playingMergedVideo.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600/30 to-purple-600/30">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
            </div>

            {/* Info */}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {playingMergedVideo.title}
              </p>
              <p className="truncate text-xs text-neutral-400">
                {playingMergedVideo.songCount} songs · Merged video
              </p>
            </div>
          </button>

          {/* Enlarge button */}
          <button
            onClick={() => navigate("/merged-videos")}
            className="mr-1 rounded-lg p-1.5 text-neutral-500 transition-colors hover:text-white"
            aria-label="Open full player"
            title="Open full player"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>

          {/* Controls */}
          <div className="flex shrink-0 items-center gap-0.5">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMergedPlay();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 sm:h-9 sm:w-9"
              aria-label={mergedPlaying ? "Pause" : "Play"}
            >
              {mergedPlaying ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          </div>

          {/* Time + Close */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[11px] tabular-nums text-neutral-500 sm:inline">
              {formatDuration(mergedCurrentTime)} / {formatDuration(mergedDuration)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseMerged();
              }}
              className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:text-neutral-400 sm:p-2"
              aria-label="Close player"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── YouTube MiniPlayer ──
  if (!currentVideo || queue.length === 0 || currentIndex < 0) return null;

  const ytProgress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:pl-56">
      {/* Progress bar */}
      <div className="h-[2px] w-full bg-neutral-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-linear"
          style={{ width: `${Math.min(ytProgress, 100)}%` }}
        />
      </div>

      {/* Main bar */}
      <div className="flex items-center gap-2 border-t border-neutral-800 bg-neutral-950/95 px-3 py-2.5 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-3">
        {/* Clickable area: thumbnail + info — navigates to playlist page */}
        <button
          onClick={() => navigate("/playlist")}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {/* Thumbnail */}
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-lg">
            <img
              src={currentVideo.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {currentVideo.title}
            </p>
            <p className="truncate text-xs text-neutral-400">
              {currentVideo.singerName || currentVideo.channelTitle}
            </p>
          </div>
        </button>

        {/* Enlarge button */}
        <button
          onClick={() => navigate("/playlist")}
          className="mr-1 rounded-lg p-1.5 text-neutral-500 transition-colors hover:text-white"
          aria-label="Open full player"
          title="Open full player"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-0.5">
          {/* Previous */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              previous();
            }}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-white sm:p-2"
            aria-label="Previous"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105 sm:h-9 sm:w-9"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-white sm:p-2"
            aria-label="Next"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>

        {/* Time + Close */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-[11px] tabular-nums text-neutral-500 sm:inline">
            {formatDuration(currentTime)} / {formatDuration(videoDuration)}
          </span>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-neutral-600 transition-colors hover:text-neutral-400 sm:p-2"
            aria-label="Close player"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
