import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  onBack?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  showActions?: boolean;
}

export function Header({ onBack, onSave, onShare, showActions = false }: HeaderProps) {
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/my-playlists", label: "My Playlists" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              aria-label="Go back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <Link to="/" className="flex items-center gap-2.5 text-white group">
            <svg width="28" height="28" viewBox="0 0 48 48" className="transition-transform duration-200 group-hover:scale-110">
              <defs>
                <linearGradient id="header-logo" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#3b82f6"/>
                  <stop offset="100%" stop-color="#a855f7"/>
                </linearGradient>
              </defs>
              <rect width="48" height="48" rx="10" fill="#0a0a0a" stroke="url(#header-logo)" stroke-width="1.5"/>
              <polygon points="18,14 18,34 34,24" fill="url(#header-logo)"/>
              <g fill="#a855f7" opacity="0.8">
                <ellipse cx="20" cy="36" rx="3" ry="2.5"/>
                <ellipse cx="31" cy="34" rx="3" ry="2.5"/>
                <path d="M23 36V18h10v16"/>
                <path d="M23 18l8-2v4l-8 2"/>
              </g>
            </svg>
            <span className="text-sm font-bold tracking-tight">Smart Playlist</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
                  ${
                    location.pathname === link.to
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
                  }
                `.trim()}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
              >
                Save
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500"
              >
                Share
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
