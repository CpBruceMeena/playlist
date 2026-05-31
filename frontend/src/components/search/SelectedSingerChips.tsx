import { useSingerStore } from "../../stores/singerStore";

export function SelectedSingerChips() {
  const selectedSingerIds = useSingerStore((s) => s.selectedSingerIds);
  const singers = useSingerStore((s) => s.singers);
  const toggleSinger = useSingerStore((s) => s.toggleSinger);
  const clearSelection = useSingerStore((s) => s.clearSelection);

  if (selectedSingerIds.length === 0) return null;

  const selectedSingers = singers.filter((s) =>
    selectedSingerIds.includes(s.id)
  );

  const GENRE_COLORS: Record<string, string> = {
    punjabi: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    haryanvi: "border-green-500/30 bg-green-500/10 text-green-300",
    hindi: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    "old-hindi": "border-amber-500/30 bg-amber-500/10 text-amber-300",
    english: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  };

  return (
    <div className="rounded-lg border border-blue-900/30 bg-blue-950/10 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="shrink-0 text-xs font-medium text-blue-400">
            Singers:
          </span>
          {selectedSingers.map((singer) => {
            const colorClass =
              GENRE_COLORS[singer.genre] ||
              "border-neutral-600 bg-neutral-800 text-neutral-300";
            return (
              <span
                key={singer.id}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colorClass}`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/20 text-[9px] font-bold">
                  {singer.name.charAt(0).toUpperCase()}
                </span>
                {singer.name}
                <button
                  onClick={() => toggleSinger(singer.id)}
                  className="ml-0.5 rounded-full p-0.5 text-current/60 transition-colors hover:text-current"
                  aria-label={`Remove ${singer.name}`}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M2 2l6 6M8 2l-6 6" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
        <button
          onClick={clearSelection}
          className="shrink-0 text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
