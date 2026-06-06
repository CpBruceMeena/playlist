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
  /** When false, the YouTube iframe is visible inline (on /playlist) and the
      off-screen YT.Player should not be created to avoid double audio. */
  visible?: boolean;
}

export function useYouTubePlayer(
  containerId: string,
  options: UseYouTubePlayerOptions = {},
) {
  const playerRef = useRef<YTPlayer | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const playerInitRef = useRef(false);

  // When false (on /playlist page), the inline embed iframe handles playback
  // so the off-screen YT.Player should be paused to avoid double audio.
  // The player itself stays alive to enable instant resume on navigation.
  const visible = options.visible ?? true;

  const {
    currentIndex,
    queue,
    isPlaying,
    volume,
    isMuted,
    queueInitCounter,
    playingMergedVideo,
    setReady,
    setPlaying,
    setCurrentTime,
    setVideoDuration,
  } = usePlayerStore();

  // Track whether we've ever had a video queued — flips to true once and stays.
  // Used to trigger player init when the first video becomes available.
  const [hasEverHadVideo, setHasEverHadVideo] = useState(false);

  useEffect(() => {
    if (queue.length > 0 && currentIndex >= 0) {
      setHasEverHadVideo(true);
    }
  }, [queue.length, currentIndex]);

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

  // Initialize player when API is loaded and a video is available.
  // NOTE: visible is NOT in deps — the player stays alive across navigations
  // to avoid the costly destroy+recreate cycle that causes 1-2s stutter.
  // When visible is false (inline player active), a separate effect pauses playback.
  useEffect(() => {
    if (!apiLoaded || playerInitRef.current || !hasEverHadVideo) return;

    // Guard against missing YouTube API
    if (!window.YT?.Player) {
      console.warn("[Player] YouTube API not available, skipping player init");
      return;
    }

    let player: YTPlayer;
    try {
      playerInitRef.current = true;
      player = new window.YT.Player(containerId, {
      height: "100%",
      width: "100%",
      videoId: queue[currentIndex]?.id,
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

    } catch (err) {
      console.error("[Player] Failed to create YouTube player:", err);
      playerInitRef.current = false;
      return;
    }

    return () => {
      // CRITICAL: Never touch the container's DOM here! React's reconciliation will
      // fail if we remove the YouTube iframe that React doesn't know about.
      // Just stop playback and reset refs so the player can continue on next mount.
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
        } catch (err) {
          console.warn("[Player] Error stopping player:", err);
        }
        playerRef.current = null;
      }
      playerInitRef.current = false;
      setIsPlayerReady(false);
      setReady(false);
    };
  }, [apiLoaded, containerId, hasEverHadVideo]);

  // Pause/resume the off-screen YT.Player when navigating to/from the
  // playlist page (where the inline iframe is active).
  // The player itself stays alive — this avoids the costly destroy+recreate
  // cycle that caused 1-2 second stutter on tab switches.
  //
  // NOTE: We check `queue.length > 0 && currentIndex >= 0` instead of
  // `isPlaying` because the off-screen player's onStateChange sets
  // isPlaying=false when paused (for inline player), causing a stale value.
  //
  // IMPORTANT: Browser autoplay policies block playVideo() in async effects.
  // We use the mute→play→unmute pattern: playing muted is always allowed.
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    if (!visible) {
      // Inline player is active (on /playlist) — pause off-screen player
      playerRef.current.pauseVideo();
    } else if (queue.length > 0 && currentIndex >= 0) {
      // Returning from playlist page — resume playback instantly
      // Use muted play to bypass autoplay policy, then unmute
      try {
        const wasMuted = usePlayerStore.getState().isMuted;
        playerRef.current.mute();
        playerRef.current.playVideo();
        setTimeout(() => {
          if (!wasMuted && playerRef.current) {
            playerRef.current.unMute();
          }
        }, 50);
      } catch (err) {
        console.warn("[Player] Error resuming playback:", err);
      }
    }
  }, [visible, isPlayerReady, queue.length, currentIndex]);

  // Stop YouTube playback when a merged video starts playing
  // Prevents both players from playing audio simultaneously
  useEffect(() => {
    if (playingMergedVideo && playerRef.current) {
      try {
        playerRef.current.stopVideo();
      } catch (err) {
        console.warn("[Player] Error stopping player for merged video:", err);
      }
    }
  }, [playingMergedVideo]);

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

  // Load new video when currentIndex changes (or queue is re-initialized)
  // queueInitCounter ensures this effect fires even when currentIndex stays 0→0
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
        // Only resume playback if the inline player is NOT active
        // Prevents double audio when on /playlist (inline iframe handles playback)
        if (isPlaying && visible) {
          player.playVideo();
        }
      }, 800);
    }
  }, [currentIndex, isPlayerReady, queueInitCounter]);

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
