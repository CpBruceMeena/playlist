import { useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { EmptyState } from "../components/feedback/EmptyState";

export function MyPlaylistsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pt-16">
        <EmptyState
          title="My Playlists"
          message="Sign in to save and manage your generated playlists. Saved playlists will appear here."
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
