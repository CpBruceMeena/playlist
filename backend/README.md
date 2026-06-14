# Backend — YouTube Smart Playlist Creator

Go API server built with Gin, GORM, and PostgreSQL.

## Tech Stack

- **Framework:** Gin (HTTP router)
- **ORM:** GORM (PostgreSQL)
- **Database:** PostgreSQL
- **External API:** YouTube Data API v3
- **Rate Limiting:** In-memory token bucket

## Structure

```
├── main.go              # Entry point, router, DB init
├── config/              # Environment variable loader
├── handlers/            # HTTP handler functions
│   ├── health.go        # Health check endpoint
│   ├── generate.go      # Playlist generation (YouTube + filters, multi-singer)
│   ├── tv_series.go     # TV series listing + episode generation
│   ├── tv_series_saved.go # Saved TV series (in-memory)
│   ├── singers.go       # Singer database endpoints
│   ├── songs.go         # Saved songs (in-memory)
│   ├── playlists.go     # Playlist CRUD
│   ├── merge.go         # Video merge proxy
│   ├── download.go      # Video download proxy
│   └── response.go      # API response wrapper
├── clients/             # External API clients
│   └── youtube.go       # YouTube Data API v3 with caching
├── services/            # Business logic
│   ├── filter.go        # Filter pipeline (duration, keywords, video type)
│   ├── cache.go         # YouTube response caching (30 min TTL)
│   ├── migrate.go       # Auto-migration + seed data
│   ├── seed_singers.go  # 500+ singer seed data
│   └── seed_tv_series.go # TV series seed (delegated to Python script)
├── middleware/           # HTTP middleware
│   ├── cors.go          # CORS
│   └── rate_limiter.go  # 10 req/min per IP, token bucket
├── routes/              # Route registration
└── structs/             # GORM models + request/response types
```

## Setup

1. **Install Go dependencies:**
   ```bash
   go mod download
   ```

2. **Configure environment** — copy from template:
   ```bash
   cp ../cabinet/.env.example .env
   # Edit .env with your YouTube API key and DB credentials
   ```

3. **Start the server:**
   ```bash
   go run .
   ```
   Server starts on `http://localhost:3001`.

## API Endpoints

All routes are prefixed with `/playlist/api/v1/`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/playlist/api/health` | Health check (includes DB ping) |
| `POST` | `generate` | Generate playlist from query + filters |
| `POST` | `generate/multi-singer` | Generate combined playlist from 1–5 singers |
| `POST` | `generate/tv-series` | Generate episode playlist for a TV series |
| `GET` | `tv-series` | List TV series (with channel/search/limit params) |
| `GET` | `tv-series/saved` | List saved TV series |
| `POST` | `tv-series/saved` | Toggle save/unsave a TV series |
| `DELETE` | `tv-series/saved/:id` | Remove a saved TV series |
| `GET` | `singers` | List singers (with genre/search params) |
| `POST` | `playlists` | Save a playlist |
| `GET` | `playlists` | List saved playlists |
| `GET` | `playlists/:id` | Get a single playlist |
| `PUT` | `playlists/:id` | Rename a playlist |
| `DELETE` | `playlists/:id` | Delete a playlist |
| `POST` | `songs/save` | Save a song to My Songs |
| `GET` | `songs/saved` | List saved songs |
| `DELETE` | `songs/saved/:id` | Remove a saved song |
| `POST` | `merge` | Request video merge (delegates to Python merge server) |
| `POST` | `downloads` | Request video download via yt-dlp |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/playlist` | PostgreSQL connection |
| `YOUTUBE_API_KEY` | — | YouTube Data API v3 key |
| `CLIENT_URL` | `http://localhost:5173` | CORS origin |

## Architecture

The generate endpoint follows this pipeline:

1. **Rate limiter** checks IP-based token bucket
2. **YouTube client** searches for videos matching the query (cached 30 min)
3. **Filter service** applies duration, video type, keyword, view count, and safe search filters
4. **Response** returns filtered videos with quota usage info
