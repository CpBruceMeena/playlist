import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSingerStore } from "../../stores/singerStore";
import { useFilterStore } from "../../stores/filterStore";
import { SingerSelectorDrawer } from "./SingerSelector";

interface SingerDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SingerDrawer({ open, onClose }: SingerDrawerProps) {
  const navigate = useNavigate();
  const singers = useSingerStore((s) => s.singers);
  const selectedSingerIds = useSingerStore((s) => s.selectedSingerIds);
  const isGenerating = useSingerStore((s) => s.isGenerating);
  const generationError = useSingerStore((s) => s.generationError);
  const generate = useSingerStore((s) => s.generate);

  const selectedSingers = singers.filter((s) => selectedSingerIds.includes(s.id));

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleGenerateCombined = useCallback(() => {
    const filters = useFilterStore.getState().getFilterPayload();
    generate(filters).then(() => {
      navigate("/playlist");
    });
  }, [generate, navigate]);

  if (!open) return null;

  const selectedCount = selectedSingerIds.length;
  const canGenerate = selectedCount >= 2 && selectedCount <= 5;
  const isGeneratingPlaylist = isGenerating;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative flex w-full max-w-[420px] flex-col bg-neutral-950 shadow-2xl"
        style={{ animation: "slideInRight 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-400"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <h2 className="text-base font-semibold text-white">Select Singers</h2>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <span className="rounded-full bg-blue-600/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                {selectedCount}/5
              </span>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              aria-label="Close singers panel"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l10 10M14 4l-10 10" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Selected singer chips at top of drawer */}
          {selectedSingers.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-600/5 px-3 py-2.5">
              <span className="mr-0.5 text-xs font-medium text-blue-400 shrink-0">
                Selected:
              </span>
              {selectedSingers.map((singer) => (
                <span
                  key={singer.id}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-600/15 px-2 py-0.5 text-xs font-medium text-blue-300"
                >
                  {singer.name}
                  <button
                    onClick={() => {
                      const store = useSingerStore.getState();
                      store.toggleSinger(singer.id);
                    }}
                    className="ml-0.5 rounded-full p-0.5 text-blue-300/60 transition-colors hover:bg-blue-500/20 hover:text-blue-200"
                    aria-label={`Remove ${singer.name}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  const store = useSingerStore.getState();
                  store.clearSelection();
                }}
                className="ml-auto text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300 shrink-0"
              >
                Clear all
              </button>
            </div>
          )}
          <SingerSelectorDrawer />

          {/* Generation error */}
          {generationError && (
            <p className="mt-3 text-xs text-red-400">{generationError}</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-5 py-4 space-y-3">
          {selectedCount >= 2 && (
            <button
              onClick={handleGenerateCombined}
              disabled={!canGenerate || isGeneratingPlaylist}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-2.5 text-sm font-medium text-white transition-all hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPlaylist ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Generating...
                </span>
              ) : (
                `Generate Combined Playlist (${selectedCount} singers)`
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className={`w-full rounded-lg py-2.5 text-sm font-medium transition-colors ${
              selectedCount >= 2
                ? "border border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                : selectedCount === 1
                  ? "border border-neutral-700/50 bg-neutral-800/30 text-neutral-500 cursor-default"
                  : "border border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            }`}
          >
            {selectedCount >= 2
              ? "Done"
              : selectedCount === 1
                ? "Select at least 2 singers"
                : "Cancel"}
          </button>
        </div>
      </div>

      {/* Slide-in animation */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
