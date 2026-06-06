import { useParams, useNavigate } from "react-router-dom";
import { SidebarLayout } from "../components/layout/Sidebar";
import { EmptyState } from "../components/feedback/EmptyState";

export function SharedPlaylistPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <main className="mx-auto max-w-3xl px-4 pt-4">
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
    </SidebarLayout>
  );
}
