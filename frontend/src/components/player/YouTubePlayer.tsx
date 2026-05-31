import { useYouTubePlayer } from "../../hooks/useYouTubePlayer";
import { usePlaylistStore } from "../../stores/playlistStore";
import { usePlayerStore as usePlayerUIStore } from "../../stores/playerStore";
import { PlayerControls } from "./PlayerControls";
import { ProgressBar } from "./ProgressBar";

interface YouTubePlayerProps {
  containerId?: string;
}

export function YouTubePlayer({
  containerId = "youtube-player",
}: YouTubePlayerProps) {
  const { videos } = usePlaylistStore();
  const {
    currentIndex,
    currentTime,
    videoDuration,
    next,
    isPlaying,
  } = usePlayerUIStore();

  // Auto-advance to next video on end
  const handleEnd = () => {
    const nextVideo = next();
    if (nextVideo) {
      // The useEffect in the hook will load the next video via currentIndex change
    }
  };

  const handleError = (errorCode: number) => {
    console.warn("YouTube player error:", errorCode);
    // Skip to next video on error
    next();
  };

  const { isPlayerReady, seekTo } = useYouTubePlayer(containerId, {
    onEnd: handleEnd,
    onError: handleError,
  });

  const currentVideo = videos[currentIndex];

  if (videos.length === 0) {
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
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <div id={containerId} className="h-full w-full" />
        {!isPlayerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-xs text-neutral-500">Loading player...</p>
            </div>
          </div>
        )}
      </div>

      {/* Video info */}
      {currentVideo && (
        <div className="px-1">
          <h2 className="text-base font-semibold text-white line-clamp-1">
            {currentVideo.title}
          </h2>
          <p className="text-sm text-neutral-400">{currentVideo.channelTitle}</p>
        </div>
      )}

      {/* Controls */}
      <PlayerControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={videoDuration}
        onSeek={seekTo}
      />

      {/* Progress bar */}
      <ProgressBar
        currentTime={currentTime}
        duration={videoDuration}
        onSeek={seekTo}
      />
    </div>
  );
}
