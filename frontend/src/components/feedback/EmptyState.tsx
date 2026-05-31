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
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-500"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
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
