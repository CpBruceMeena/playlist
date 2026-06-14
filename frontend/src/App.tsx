import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { Spinner } from "./components/ui/Spinner";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PlaylistPage = lazy(() => import("./pages/PlaylistPage").then((m) => ({ default: m.PlaylistPage })));
const MyPlaylistsPage = lazy(() => import("./pages/MyPlaylistsPage").then((m) => ({ default: m.MyPlaylistsPage })));
const MySongsPage = lazy(() => import("./pages/MySongsPage").then((m) => ({ default: m.MySongsPage })));
const MergedVideosPage = lazy(() => import("./pages/MergedVideosPage").then((m) => ({ default: m.MergedVideosPage })));
const TVSeriesPage = lazy(() => import("./pages/TVSeriesPage").then((m) => ({ default: m.TVSeriesPage })));
const DownloadsPage = lazy(() => import("./pages/DownloadsPage").then((m) => ({ default: m.DownloadsPage })));
const SharedPlaylistPage = lazy(() => import("./pages/SharedPlaylistPage").then((m) => ({ default: m.SharedPlaylistPage })));

function PageLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-neutral-950 text-white">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/playlist/new" element={<PlaylistPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/playlist" element={<PlaylistPage />} />
              <Route path="/tv-series" element={<TVSeriesPage />} />
              <Route path="/my-songs" element={<MySongsPage />} />
              <Route path="/my-playlists" element={<MyPlaylistsPage />} />
              <Route path="/merged-videos" element={<MergedVideosPage />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/p/:shareId" element={<SharedPlaylistPage />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
