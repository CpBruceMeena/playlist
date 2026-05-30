import { useParams } from "react-router-dom";

export function SharedPlaylistPage() {
  const { shareId } = useParams<{ shareId: string }>();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center gap-4 border-b border-neutral-800 px-6 py-4">
        <h1 className="text-lg font-bold">Shared Playlist</h1>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-neutral-400">Loading shared playlist...</p>
        <p className="mt-2 text-sm text-neutral-600">Share ID: {shareId}</p>
      </main>
    </div>
  );
}
