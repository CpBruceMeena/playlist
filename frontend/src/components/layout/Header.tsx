import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  onBack?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  showActions?: boolean;
}

export function Header({ onSave, onShare, showActions = false }: HeaderProps) {
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
          <Link to="/" className="flex items-center gap-2 text-white">
            <span className="text-lg">🎵</span>
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
