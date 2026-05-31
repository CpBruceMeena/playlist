import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  onBack?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  showActions?: boolean;
}

const NAV_LINKS = [
  { to: "/", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/my-playlists", label: "My Playlists", icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
];

export function Header({ onBack, onSave, onShare, showActions = false }: HeaderProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Close mobile menu on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left section: Back + Logo + Desktop Nav */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="mr-1 flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-all duration-200 hover:bg-white/5 hover:text-white active:scale-95"
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Logo + Brand */}
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

          {/* Desktop navigation */}
          <nav className="ml-4 hidden items-center gap-0.5 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200
                  ${isActive(link.to)
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                  }
                `.trim()}
              >
                {isActive(link.to) && (
                  <span className="absolute inset-0 rounded-xl bg-white/5" />
                )}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right section: Actions + Mobile menu */}
        <div className="flex items-center gap-2">
          {showActions && (
            <div className="flex items-center gap-1.5">
              {onSave && (
                <button
                  onClick={onSave}
                  className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3.5 py-2 text-xs font-medium text-neutral-300 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 transition-all duration-200 hover:bg-white/5 hover:text-white sm:hidden"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/5 px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                  ${isActive(link.to)
                    ? "bg-white/5 text-white"
                    : "text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
                  }
                `.trim()}
              >
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
                  <path d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
