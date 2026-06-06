import { useState, useEffect, memo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useYouTubePlayer } from "../../hooks/useYouTubePlayer";
import { usePlayerStore } from "../../stores/playerStore";
import { MiniPlayer } from "../player/MiniPlayer";
import { MiniPlayerErrorBoundary } from "../feedback/MiniPlayerErrorBoundary";

interface SidebarLayoutProps {
  children: ReactNode;
  /** Optional action bar buttons rendered at the top of the content area */
  actions?: ReactNode;
  /** Hide the top border/bar entirely (for pages that manage their own top area) */
  noTopBar?: boolean;
}

const NAV_ITEMS = [
  {
    to: "/",
    label: "Home",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    to: "/my-songs",
    label: "My Songs",
    icon: "M9 18V5l12-2v13M9 18c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z",
  },
  {
    to: "/merged-videos",
    label: "Merged",
    icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14",
  },
  {
    to: "/my-playlists",
    label: "Playlists",
    icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  },
];

export const SidebarLayout = memo(function SidebarLayout({ children, actions, noTopBar }: SidebarLayoutProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-white/5 bg-neutral-950 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-white/5 px-5">
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:shadow-blue-500/30 group-hover:scale-105">
              <svg width="20" height="20" viewBox="0 0 48 48" fill="white" className="drop-shadow-sm">
                <polygon points="18,14 18,34 34,24" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Smart Playlist
            </span>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`
                relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200
                ${
                  isActive(item.to)
                    ? "bg-white/5 text-white"
                    : "text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300"
                }
              `.trim()}
            >
              {isActive(item.to) && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-blue-500" />
              )}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 px-5 py-4">
          <p className="text-[11px] text-neutral-600">Smart Playlist Creator</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-56">
        {/* Top bar */}
        {!noTopBar && (
          <div className="sticky top-0 z-30 flex h-16 items-center border-b border-white/5 bg-neutral-950/90 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-all duration-200 hover:bg-white/5 hover:text-white lg:hidden"
                aria-label="Open navigation menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {/* Page content — add bottom padding for mini-player */}
        {children}
      </div>
    </div>
  );
});

/* ─── Persistent YouTube Player ─── */

export const PLAYER_CONTAINER_ID = "youtube-player";

export function PersistentPlayerProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}

      {/* Portal YouTube container to document.body so YT.Player's iframe is
          completely outside React's reconciliation tree — prevents DOM clashes
          between the iframe and MiniPlayer during route transitions. */}
      {createPortal(
        <div
          id={PLAYER_CONTAINER_ID}
          className="pointer-events-none fixed -left-[9999px] top-0 h-[360px] w-[640px] opacity-0"
        />,
        document.body,
      )}
    </>
  );
}

export function PersistentPlayerContent() {
  const location = useLocation();
  const isPlaylistPage = location.pathname.startsWith("/playlist");

  const next = usePlayerStore((s) => s.next);

  const handleEnd = () => {
    usePlayerStore.getState().setPlaying(true);
    next();
  };

  const handleError = (errorCode: number) => {
    console.warn("YouTube player error:", errorCode);
    next();
  };

  useYouTubePlayer(PLAYER_CONTAINER_ID, {
    onEnd: handleEnd,
    onError: handleError,
    // On /playlist, the inline YouTube embed iframe handles playback,
    // so skip creating the off-screen YT.Player to avoid double audio.
    visible: !isPlaylistPage,
  });

  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playingMergedVideo = usePlayerStore((s) => s.playingMergedVideo);
  const hasContent =
    (queue.length > 0 && currentIndex >= 0) || playingMergedVideo !== null;

  const isMergedVideosPage = location.pathname.startsWith("/merged-videos");
  const hasInlinePlayer = isPlaylistPage || (isMergedVideosPage && playingMergedVideo !== null);

  return (
    <>
      {/* Mini-player bar at bottom — hidden when inline player is shown */}
      {/* Key uses pathname so error boundary resets on every navigation */}
      {hasContent && !hasInlinePlayer && (
        <MiniPlayerErrorBoundary key={location.pathname}>
          <MiniPlayer />
        </MiniPlayerErrorBoundary>
      )}
    </>
  );
}
