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
      },
      events: {
        onReady: () => {
          playerRef.current = player;
          setIsPlayerReady(true);
          setReady(true);
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
  // cueVideoById doesn't auto-play — play only if user was already playing
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    const video = queue[currentIndex];
    if (video) {
      playerRef.current.cueVideoById(video.id);
      setCurrentTime(0);
      // If user was playing, start the new video immediately
      if (isPlaying) {
        playerRef.current.playVideo();
      }
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
    usePlayerStore.getState().play();
    playerRef.current?.playVideo();
  }, []);

  const pauseVideo = useCallback(() => {
    usePlayerStore.getState().pause();
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
  };
}
