import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { EmptyState } from "../components/feedback/EmptyState";

export function SharedPlaylistPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pt-16">
        <EmptyState
          title="Shared Playlist"
          message={`Viewing shared playlist: ${shareId}. Sharing functionality will be available in a future update.`}
          suggestions={[
            {
              label: "Generate your own",
              onClick: () => navigate("/"),
            },
          ]}
        />
      </main>
    </div>
  );
}
