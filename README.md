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

## 🏗️ Architecture

| Service | Language | Port | Purpose |
|---------|----------|------|---------|
| **Frontend** | React / Vite / TypeScript | `5173` | User interface — playlist browser, player, and management |
| **Backend** | Go / Gin | `3001` | Primary API — YouTube search, playlist CRUD, proxies merge requests |
| **Merge Server** | Python / Flask | `5002` | Video merge service — downloads YouTube videos with yt-dlp, concatenates with ffmpeg |

The **Go backend** is the single entry point for all frontend API calls. The **Merge Server** runs as a separate process and is only called by the Go backend via proxy — the frontend never talks to it directly.

## 🚀 Quick Start

### Prerequisites
- **Go** 1.26+
- **Node.js** 20+ with npm
- **Python** 3.10+
- **PostgreSQL** (running on port 5432)
- **ffmpeg** — Required for the merge server to concatenate videos
- **yt-dlp** — Required for the merge server to download YouTube videos

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd playlist

# Install frontend dependencies
cd frontend && npm install && cd ..

# Download Go dependencies
cd backend && go mod download && cd ..

# Install Python dependencies for the merge server
pip3 install flask

# Configure your YouTube API key (see backend/README.md)

# Start all 3 services
bash run.sh
```

### Running Services Manually

```bash
# Terminal 1: Backend (Go)
cd backend && go run main.go

# Terminal 2: Merge Server (Python)
python3 scripts/merge_server.py

# Terminal 3: Frontend
cd frontend && npx vite
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Merge Server:** http://localhost:5002 (proxied through the backend)

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
