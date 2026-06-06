import { useEffect } from "react";
import { usePlayerStore } from "../../stores/playerStore";

function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function YouTubePlayer() {
  const {
    queue,
    currentIndex,
    next,
    previous,
  } = usePlayerStore();

  const currentVideo = queue[currentIndex];

  // Listen for YouTube iframe postMessage events to detect video end
  // and auto-advance to the next song in the queue
  useEffect(() => {
    if (!currentVideo) return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        // onStateChange with info=0 means the video ended
        if (data.event === "onStateChange" && data.info === 0) {
          next();
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [currentVideo?.id, next]);

  if (queue.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-neutral-900">
        <div className="text-center">
          <div className="mb-3 text-4xl">🎵</div>
          <p className="text-sm text-neutral-500">
            Generate a playlist to start watching
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Video player — actual YouTube video embed */}
      {currentVideo && (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            key={currentVideo.id}
            src={`https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=0&enablejsapi=1`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={currentVideo.title}
          />
        </div>
      )}

      {/* Video info bar — shows title, artist, and queue navigation */}
      {currentVideo && (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 backdrop-blur-sm">
          {/* Title and artist */}
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-white line-clamp-1">
              {currentVideo.title}
            </h2>
            <p className="text-xs text-neutral-400">
              {currentVideo.singerName || currentVideo.channelTitle}
            </p>
          </div>

          {/* Duration + position indicator */}
          <div className="hidden sm:block text-[11px] text-neutral-500 tabular-nums">
            {currentVideo.duration || formatDuration(currentVideo.durationSeconds || 0)}
            {queue.length > 1 && (
              <span className="ml-2 text-neutral-600">
                {currentIndex + 1} / {queue.length}
              </span>
            )}
          </div>

          {/* Queue navigation controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={previous}
              className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-white"
              aria-label="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={next}
              className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:text-white"
              aria-label="Next"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
