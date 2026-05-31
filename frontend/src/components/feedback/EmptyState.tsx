import { Chip } from "../ui/Chip";

interface Suggestion {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  suggestions?: (Suggestion | string)[];
  variant?: "full" | "inline";
}

const defaultSuggestions: string[] = [
  "Lofi beats to study to",
  "90s rock classics",
  "Arijit Singh songs",
  "Workout motivation",
];

export function EmptyState({
  title = "No results yet",
  message = "Describe what you want to hear and we'll build a YouTube playlist from it.",
  suggestions,
  variant = "full",
}: EmptyStateProps) {
  const displaySuggestions = suggestions ?? defaultSuggestions;

  const content = (
    <>
      <div className="mb-6 flex items-center justify-center">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle cx="40" cy="40" r="36" fill="#0a0a0a" stroke="#262626" strokeWidth="2"/>
          {/* Play icon */}
          <polygon points="34,26 34,54 56,40" fill="url(#empty-gradient)" opacity="0.6"/>
          {/* Music notes */}
          <g opacity="0.4">
            <circle cx="24" cy="52" r="4" fill="#a855f7"/>
            <circle cx="58" cy="48" r="3" fill="#3b82f6"/>
            <path d="M28 52V32l10-2v18" stroke="#a855f7" strokeWidth="2" fill="none"/>
            <path d="M61 48V36l6-1v11" stroke="#3b82f6" strokeWidth="1.5" fill="none"/>
          </g>
          <rect x="30" y="28" width="4" height="24" rx="1.5" fill="#3b82f6" opacity="0.3"/>
          <rect x="38" y="24" width="4" height="28" rx="1.5" fill="#a855f7" opacity="0.2"/>
          <defs>
            <linearGradient id="empty-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#a855f7"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-neutral-400">{message}</p>
      {displaySuggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {displaySuggestions.map((suggestion) => {
            if (typeof suggestion === "string") {
              return (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  variant="suggestion"
                />
              );
            }
            return (
              <Chip
                key={suggestion.label}
                label={suggestion.label}
                variant="suggestion"
                onClick={suggestion.onClick}
              />
            );
          })}
        </div>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-neutral-700 px-6 py-8 text-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {content}
    </div>
  );
}
