import { useToastStore, type ToastType } from "../../stores/toastStore";

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const STYLES: Record<ToastType, string> = {
  success:
    "border-green-500/30 bg-green-500/10 text-green-400",
  error:
    "border-red-500/30 bg-red-500/10 text-red-400",
  info:
    "border-blue-500/30 bg-blue-500/10 text-blue-400",
  warning:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm shadow-lg backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-2 ${STYLES[toast.type]}`}
          role="alert"
        >
          <span className="text-sm font-bold">{ICONS[toast.type]}</span>
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                removeToast(toast.id);
              }}
              className="ml-1 rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            aria-label="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
