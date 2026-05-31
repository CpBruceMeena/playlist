import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { YouTubePlayer } from "../components/player/YouTubePlayer";
import { QueueList, QueueHeader } from "../components/player/QueueList";
import { EmptyState } from "../components/feedback/EmptyState";
import { usePlaylistStore } from "../stores/playlistStore";
import { usePlayerStore } from "../stores/playerStore";

export function PlaylistPage() {
  const navigate = useNavigate();
  const { videos } = usePlaylistStore();
  const {
    queue,
    currentIndex,
    shuffleMode,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
  } = usePlayerStore();

  // If no videos, show empty state with option to go back
  if (videos.length === 0 && queue.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <Header />
        <main className="mx-auto max-w-3xl px-4 pt-24">
          <EmptyState
            title="No playlist loaded"
            message="Go back to the home page and generate a playlist to get started."
            suggestions={[
              {
                label: "Generate a playlist",
                onClick: () => navigate("/"),
              },
            ]}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header showActions />

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Player section */}
          <div className="flex-1">
            <YouTubePlayer />
          </div>

          {/* Queue section */}
          <div className="w-full lg:w-80">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50">
              <QueueHeader
                count={queue.length}
                shuffleMode={shuffleMode}
                repeatMode={repeatMode}
                onToggleShuffle={toggleShuffle}
                onToggleRepeat={toggleRepeat}
              />

              <div className="max-h-[60vh] overflow-y-auto">
                <QueueList />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
