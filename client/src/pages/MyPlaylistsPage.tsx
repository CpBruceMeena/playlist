export function MyPlaylistsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <a href="/" className="text-neutral-400 transition-colors hover:text-white">
            ← Back
          </a>
          <h1 className="text-lg font-bold">My Playlists</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg border border-dashed border-neutral-700 p-12 text-center">
          <p className="text-lg text-neutral-400">Sign in to save and view your playlists</p>
          <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-500">
            Sign in with Google
          </button>
        </div>
      </main>
    </div>
  );
}
