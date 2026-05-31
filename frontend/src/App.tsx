import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { PlaylistPage } from "./pages/PlaylistPage";
import { MyPlaylistsPage } from "./pages/MyPlaylistsPage";
import { SharedPlaylistPage } from "./pages/SharedPlaylistPage";
import { ToastContainer } from "./components/feedback/ToastContainer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/playlist/:id" element={<PlaylistPage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
        <Route path="/my-playlists" element={<MyPlaylistsPage />} />
        <Route path="/p/:shareId" element={<SharedPlaylistPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
