import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { ToastContainer } from "./components/feedback/ToastContainer";
import { Spinner } from "./components/ui/Spinner";
import {
  PersistentPlayerProvider,
  PersistentPlayerContent,
} from "./components/layout/Sidebar";
import { usePlayerStore } from "./stores/playerStore";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage").then((m) => ({ default: m.PlaylistPage })));
const MyPlaylistsPage = lazy(() => import("./pages/MyPlaylistsPage").then((m) => ({ default: m.MyPlaylistsPage })));
const MySongsPage = lazy(() => import("./pages/MySongsPage").then((m) => ({ default: m.MySongsPage })));
const MergedVideosPage = lazy(() => import("./pages/MergedVideosPage").then((m) => ({ default: m.MergedVideosPage })));
const SharedPlaylistPage = lazy(() => import("./pages/SharedPlaylistPage").then((m) => ({ default: m.SharedPlaylistPage })));

function PageLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  const hasPlayer = usePlayerStore(
    (s) => s.queue.length > 0 && s.currentIndex >= 0,
  );

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <PersistentPlayerProvider>
          <div className={`min-h-screen bg-neutral-950 text-white ${hasPlayer ? "pb-20" : ""}`}>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/playlist/new" element={<PlaylistPage />} />
                <Route path="/playlist/:id" element={<PlaylistPage />} />
                <Route path="/playlist" element={<PlaylistPage />} />
                <Route path="/my-songs" element={<MySongsPage />} />
                <Route path="/my-playlists" element={<MyPlaylistsPage />} />
                <Route path="/merged-videos" element={<MergedVideosPage />} />
                <Route path="/p/:shareId" element={<SharedPlaylistPage />} />
              </Routes>
            </Suspense>
          </div>
          <PersistentPlayerContent />
          <ToastContainer />
        </PersistentPlayerProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
