import { useParams } from "react-router-dom";

export function PlaylistPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <a href="/" className="text-neutral-400 transition-colors hover:text-white">
            ← Back
          </a>
          <h1 className="text-lg font-bold">Playlist</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg bg-neutral-800 px-4 py-2 text-sm transition-colors hover:bg-neutral-700">
            Save
          </button>
          <button className="rounded-lg bg-neutral-800 px-4 py-2 text-sm transition-colors hover:bg-neutral-700">
            Share
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl gap-6 px-4 py-6">
        <div className="flex-1">
          <div className="aspect-video rounded-lg bg-neutral-900 flex items-center justify-center text-neutral-600">
            YouTube Player
          </div>
          <p className="mt-4 text-sm text-neutral-500">Playlist ID: {id}</p>
        </div>
        <div className="w-80">
          <div className="rounded-lg border border-neutral-800 p-4">
            <h2 className="mb-3 text-sm font-medium text-neutral-400 uppercase tracking-wider">Queue</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-md bg-neutral-900 px-3 py-2">
                <span className="text-sm text-neutral-500 w-5">1</span>
                <div className="flex-1">
                  <p className="text-sm text-neutral-300">Video title</p>
                  <p className="text-xs text-neutral-600">Channel</p>
                </div>
                <span className="text-xs text-neutral-600">4:13</span>
              </div>
              <div className="rounded-md bg-neutral-900 px-3 py-2 text-center text-sm text-neutral-600">
                No videos yet — generate a playlist to get started
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
