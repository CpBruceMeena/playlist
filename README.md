# Smart Playlist Creator 🎵

> AI-powered YouTube playlist generator with smart filters and an embedded player.

Generate custom YouTube playlists by typing a description — like *"lofi beats to study to"* or *"90s rock classics"* — and our smart search engine builds a curated playlist with intelligent filtering. Watch everything seamlessly in-browser without leaving the website.

## ✨ Features

- **🧠 AI-Powered Generation** — Describe what you want in natural language, get a curated playlist in seconds
- **🎛️ Smart Filters** — Refine results by duration, video type, upload date, keywords, view count, and more
- **🎤 Multi-Singer Playlists** — Select multiple singers for a combined playlist with balanced results from each
- **▶️ Embedded Player** — Watch videos directly in-browser with play/pause, next/previous, shuffle, repeat, and seek
- **💾 Save & Organize** — Save playlists locally with inline rename and undo delete for accidental removals
- **🔗 Share Playlists** — Generate shareable links to send your playlists to anyone
- **⌨️ Keyboard Shortcuts** — Space (play/pause), N/P (next/previous), M (mute), ←/→ (seek)
- **🎨 Beautiful Dark UI** — Modern gradient-accented design with smooth animations and glassmorphism effects

## 🖼️ Screenshots

```
Home Page:   Search input with suggestion chips, collapsible filter panel, and singer selector
Playlist Page: YouTube player with custom controls, progress bar, queue management, and save dialog
My Playlists: Saved playlist cards with inline rename, load, and undo delete
```

## 🚀 Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd playlist

# Install dependencies
cd frontend && npm install && cd ..
cd backend && go mod download && cd ..

# Configure your YouTube API key (see backend/README.md)
# Then start both services
bash run.sh
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `N` | Next video |
| `P` | Previous video |
| `M` | Mute / Unmute |
| `←` | Seek backward |
| `→` | Seek forward |
| `Escape` | Close dialogs |

## 📄 License

MIT — See [LICENSE](LICENSE) for details.

---

Built with ❤️ using React, Go, and the YouTube API.
