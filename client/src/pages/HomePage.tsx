import { useState } from "react";

export function HomePage() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-6 py-4">
        <h1 className="text-xl font-bold text-white">🎵 Smart Playlist</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white">
            Generate the perfect playlist
          </h2>
          <p className="mt-3 text-lg text-neutral-400">
            Describe what you want to hear — we'll build a YouTube playlist from it.
          </p>
        </div>

        <div className="mt-10">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "Arijit Singh love songs 2024"'
              className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 outline-none transition-colors focus:border-blue-500"
            />
            <button
              disabled={!query.trim()}
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-neutral-600">
          <p>Try: "upbeat workout songs", "lofi hip hop beats", "90s rock classics"</p>
        </div>
      </main>
    </div>
  );
}
