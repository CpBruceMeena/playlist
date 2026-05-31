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
│   ├── generate.go      # Playlist generation (YouTube + filters)
│   └── response.go      # API response wrapper
├── clients/             # External API clients
│   └── youtube.go       # YouTube Data API v3 with caching
├── services/            # Business logic
│   └── filter.go        # Filter pipeline (duration, keywords, video type)
├── middleware/           # HTTP middleware
│   ├── cors.go          # CORS
│   └── rate_limiter.go  # 10 req/min per IP
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

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (includes DB ping) |
| `POST` | `/api/v1/generate` | Generate playlist from query + filters |

### POST /api/v1/generate

**Request:**
```json
{
  "query": "upbeat indie rock 2023",
  "filters": {
    "maxDuration": 300,
    "minDuration": 60,
    "videoType": "music",
    "keywords": ["indie", "rock"],
    "excludedKeywords": ["live", "cover"],
    "minViews": 10000,
    "safeSearch": true
  },
  "maxResults": 25
}
```

**Response:**
```json
{
  "data": {
    "videos": [
      {
        "id": "dQw4w9WgXcQ",
        "title": "...",
        "channelTitle": "...",
        "thumbnails": { ... },
        "duration": 212,
        "viewCount": "1234567",
        "videoType": "music"
      }
    ],
    "quotaUsed": 102
  }
}
```

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
