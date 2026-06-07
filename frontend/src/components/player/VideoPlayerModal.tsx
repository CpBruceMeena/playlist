import { useEffect, useRef, useCallback } from "react";

interface VideoPlayerModalProps {
  videoUrl: string;
  title?: string;
  onClose: () => void;
}

export function VideoPlayerModal({ videoUrl, title, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Title */}
        {title && (
          <p className="mb-2 truncate text-sm font-medium text-white/80 pr-10">
            {title}
          </p>
        )}

        {/* HTML5 Video player */}
        <div className="overflow-hidden rounded-xl bg-black shadow-2xl">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            autoPlay
            className="w-full"
            style={{ maxHeight: "80vh" }}
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
