/* ─── YouTube IFrame API Type Declarations ─── */

declare namespace YT {
  class Player {
    constructor(elementId: string, options: PlayerOptions);
    loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
    destroy(): void;
    getPlayerState(): number;
    getCurrentTime(): number;
    getDuration(): number;
  }

  interface PlayerOptions {
    height?: string | number;
    width?: string | number;
    videoId?: string;
    playerVars?: PlayerVars;
    events?: Events;
  }

  interface PlayerVars {
    autoplay?: 0 | 1;
    controls?: 0 | 1;
    rel?: 0 | 1;
    modestbranding?: 0 | 1;
    enablejsapi?: 0 | 1;
    origin?: string;
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void;
    onStateChange?: (event: OnStateChangeEvent) => void;
    onError?: (event: OnErrorEvent) => void;
  }

  interface PlayerEvent {
    target: Player;
  }

  interface OnStateChangeEvent {
    data: number;
    target: Player;
  }

  interface OnErrorEvent {
    data: number;
    target: Player;
  }

  const PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}
