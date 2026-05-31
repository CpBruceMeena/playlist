import { Button } from "../ui/Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onSecondaryAction?: { label: string; onClick: () => void };
  variant?: "full" | "inline";
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  onSecondaryAction,
  variant = "full",
}: ErrorStateProps) {
  const content = (
    <>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-400"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-neutral-400">{message}</p>
      <div className="flex items-center gap-3">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {onSecondaryAction && (
          <Button variant="ghost" size="sm" onClick={onSecondaryAction.onClick}>
            {onSecondaryAction.label}
          </Button>
        )}
      </div>
    </>
  );

  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center rounded-lg border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
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
