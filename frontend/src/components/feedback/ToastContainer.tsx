import { useEffect, useState } from "react";
import { useToastStore, type ToastType } from "../../stores/toastStore";

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 8 10 16 7 13" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const STYLES: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/25",
    icon: "text-green-400",
    bar: "bg-green-500",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    icon: "text-red-400",
    bar: "bg-red-500",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    icon: "text-blue-400",
    bar: "bg-blue-500",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/25",
    icon: "text-yellow-400",
    bar: "bg-yellow-500",
  },
};

function ToastItem({ message, type, duration, action, onDismiss }: {
  message: string;
  type: ToastType;
  duration: number;
  action?: { label: string; onClick: () => void };
  onDismiss: () => void;
}) {
  const [progress, setProgress] = useState(100);
  const style = STYLES[type];
  const isPersistent = duration <= 0;

  useEffect(() => {
    if (isPersistent) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [duration, isPersistent]);

  return (
    <div
      className={`flex w-full max-w-sm items-start gap-3 rounded-xl border ${style.border} ${style.bg} bg-neutral-950/90 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 animate-in slide-in-from-bottom-4 fade-in`}
      role="alert"
    >
      {/* Colored accent bar */}
      <div className={`mt-0.5 flex h-8 w-1 shrink-0 rounded-full ${style.bar}`} />

      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${style.icon}`}>
        {ICONS[type]}
      </span>

      {/* Message + Action */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm leading-tight text-neutral-200">{message}</p>
        {duration > 0 && !isPersistent && (
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className={`h-full rounded-full transition-all duration-100 ease-linear ${style.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>      {/* Action button */}
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
            className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            {action.label}
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={onDismiss}
          className="mt-0.5 shrink-0 rounded-lg p-1 text-neutral-500 opacity-60 transition-all hover:bg-white/5 hover:opacity-100"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (          <ToastItem
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            action={toast.action}
            onDismiss={() => removeToast(toast.id)}
          />
      ))}
    </div>
  );
}
