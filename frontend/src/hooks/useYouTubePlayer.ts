import { useEffect, useRef, useCallback, useState } from "react";
import { usePlayerStore } from "../stores/playerStore";

// YouTube IFrame Player API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: YTPlayerConfig,
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YTPlayerConfig {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: (event: { target: YTPlayer }) => void;
    onStateChange?: (event: { data: number }) => void;
    onError?: (event: { data: number }) => void;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  destroy: () => void;
  getPlayerState: () => number;
}

interface UseYouTubePlayerOptions {
  onReady?: () => void;
  onEnd?: () => void;
  onError?: (errorCode: number) => void;
}

export function useYouTubePlayer(
  containerId: string,
  options: UseYouTubePlayerOptions = {},
) {
  const playerRef = useRef<YTPlayer | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const playerInitRef = useRef(false);

  const {
    currentIndex,
    queue,
    isPlaying,
    volume,
    isMuted,
    setReady,
    setPlaying,
    setCurrentTime,
    setVideoDuration,
  } = usePlayerStore();

  // Load the YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApiLoaded(true);
      return;
    }

    // Create script tag
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.defer = true;

    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Wait for API to be ready
    window.onYouTubeIframeAPIReady = () => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApiLoaded(true);
    };

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  // Initialize player when API is loaded
  useEffect(() => {
    if (!apiLoaded || playerInitRef.current || !queue[currentIndex]) return;

    playerInitRef.current = true;

    const player = new window.YT.Player(containerId, {
      height: "100%",
      width: "100%",
      videoId: queue[currentIndex].id,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
        fs: 0,
        playsinline: 1,
        origin: window.location.origin,
        enablejsapi: 1,
      },
      events: {
        onReady: () => {
          playerRef.current = player;
          setIsPlayerReady(true);
          setReady(true);
          // Pre-load the video content and "unlock" autoplay:
          // 1. Mute (required for autoplay policy bypass)
          // 2. Play muted (always allowed by browsers)
          // 3. Pause immediately (content is now loaded and ready)
          // This ensures subsequent playVideo() calls work without delay
          try {
            player.mute();
            player.playVideo();
            // Small delay to let content start buffering, then pause
            setTimeout(() => {
              if (!playerRef.current) return;
              player.pauseVideo();
              // Restore user's mute preference
              if (!usePlayerStore.getState().isMuted) {
                player.unMute();
              }
            }, 800);
          } catch {
            // Ignore errors during pre-load
          }
          options.onReady?.();
        },
        onStateChange: (event) => {
          const state = event.data;
          if (state === window.YT.PlayerState.PLAYING) {
            setPlaying(true);
          } else if (
            state === window.YT.PlayerState.PAUSED ||
            state === window.YT.PlayerState.BUFFERING
          ) {
            setPlaying(false);
          } else if (state === window.YT.PlayerState.ENDED) {
            setPlaying(false);
            options.onEnd?.();
          }
        },
        onError: (event) => {
          console.error('[Player] YouTube error code:', event.data);
          options.onError?.(event.data);
        },
      },
    });

    return () => {
      // Destroy the player on unmount
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerInitRef.current = false;
      setIsPlayerReady(false);
      setReady(false);
    };
  }, [apiLoaded, containerId]);

  // Sync volume
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
    }
  }, [volume, isMuted, isPlayerReady]);

  // Load new video when currentIndex changes
  // Use loadVideoById with mute to pre-load content (muted load bypasses autoplay policy)
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    const video = queue[currentIndex];
    if (video) {
      const player = playerRef.current;
      // Pre-load the video content and pause (muted load is always allowed)
      const wasMuted = usePlayerStore.getState().isMuted;
      player.mute();
      player.loadVideoById(video.id);
      setCurrentTime(0);
      // Pause after a delay to let content load
      setTimeout(() => {
        if (!playerRef.current) return;
        player.pauseVideo();
        if (!wasMuted) {
          player.unMute();
        }
        // If user was playing, resume
        if (isPlaying) {
          player.playVideo();
        }
      }, 800);
    }
  }, [currentIndex, isPlayerReady]);

  // Sync play/pause state (doesn't fire on index change — handled above)
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isPlayerReady]);

  // Track current time
  useEffect(() => {
    if (!isPlayerReady || !isPlaying) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying]);

  // Set duration when video loads
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    // Duration is available shortly after onReady
    const checkDuration = setInterval(() => {
      if (playerRef.current) {
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setVideoDuration(duration);
          clearInterval(checkDuration);
        }
      }
    }, 100);

    return () => clearInterval(checkDuration);
  }, [isPlayerReady, currentIndex]);

  // Direct play/pause — called directly from user gestures, bypasses async useEffect
  const playVideo = useCallback(() => {
    const state = usePlayerStore.getState();
    state.play();
    playerRef.current?.playVideo();
  }, []);

  const pauseVideo = useCallback(() => {
    const state = usePlayerStore.getState();
    state.pause();
    playerRef.current?.pauseVideo();
  }, []);

  const togglePlay = useCallback(() => {
    const state = usePlayerStore.getState();
    if (state.isPlaying) {
      state.pause();
      playerRef.current?.pauseVideo();
    } else {
      state.play();
      playerRef.current?.playVideo();
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds, true);
  }, []);

  return {
    isPlayerReady,
    playVideo,
    pauseVideo,
    seekTo,
    togglePlay,
  };
}
