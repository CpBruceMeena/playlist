import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface UseSimplePlayerOptions {
  containerId: string;
  onEnd?: () => void;
  onReady?: () => void;
}

export function useSimplePlayer({ containerId, onEnd, onReady }: UseSimplePlayerOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<YT.Player | null>(null);
  const apiReadyRef = useRef(false);
  const onEndRef = useRef(onEnd);
  const onReadyRef = useRef(onReady);

  // Keep callback refs current
  onEndRef.current = onEnd;
  onReadyRef.current = onReady;

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true;
      return;
    }

    if (document.getElementById("youtube-iframe-api")) return;

    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      apiReadyRef.current = true;
      // Dispatch a custom event so waiting effects can proceed
      window.dispatchEvent(new Event("youtube-api-ready"));
    };

    return () => {
      // Clean up the global callback on unmount
      if (window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady = undefined;
      }
    };
  }, []);

  // Create/destroy player
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    let player: YT.Player | null = null;

    function createPlayer() {
      if (!window.YT?.Player) return;

      player = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            setIsReady(true);
            onReadyRef.current?.();
          },
          onStateChange: (event: YT.OnStateChangeEvent) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            if (event.data === window.YT.PlayerState.ENDED) {
              onEndRef.current?.();
            }
          },
        },
      });
    }

    // If API is already loaded, create immediately
    if (apiReadyRef.current && window.YT?.Player) {
      createPlayer();
    } else {
      // Wait for API to load
      const onApiReady = () => createPlayer();
      window.addEventListener("youtube-api-ready", onApiReady);
      return () => {
        window.removeEventListener("youtube-api-ready", onApiReady);
        player?.destroy();
        playerRef.current = null;
      };
    }

    return () => {
      player?.destroy();
      playerRef.current = null;
    };
  }, [containerId]);

  const loadVideo = useCallback((videoId: string, autoplay = true) => {
    if (playerRef.current) {
      if (autoplay) {
        playerRef.current.loadVideoById(videoId);
        setIsPlaying(true);
      } else {
        playerRef.current.cueVideoById(videoId);
        setIsPlaying(false);
      }
    }
  }, []);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
    setIsPlaying(false);
  }, []);

  return { isReady, isPlaying, loadVideo, play, pause };
}
