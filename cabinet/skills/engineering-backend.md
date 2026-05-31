# Engineering Backend — Go Conventions

## Stack

| Technology | Choice | Justification |
|------------|--------|---------------|
| **Language** | Go | Type-safe, high performance, simple deployment |
| **HTTP Framework** | Gin | Most popular, excellent docs, great for REST APIs |
| **Database ORM** | GORM | Full ORM, auto-migrations, most popular Go ORM |
| **Database** | PostgreSQL 15+ | Already running on localhost:5432 |
| **Auth** | JWT (golang-jwt) | Standard token-based auth |

## Project Structure

All Go code lives in `backend/` directory.

```
backend/
├── main.go              # Entry point, Gin setup, server start
├── routes.go            # All route definitions in one file
├── structs/             # GORM models + request/response types
│   ├── user.go
│   ├── playlist.go
│   └── playlist_video.go
├── handlers/            # HTTP handlers (views) — thin layer
│   ├── generate.go
│   ├── playlists.go
│   └── auth.go
├── services/            # Business logic layer
│   ├── youtube.go
│   ├── filter.go
│   ├── playlist.go
│   └── auth.go
├── middleware/          # Gin middleware
│   ├── auth.go
│   ├── rate_limiter.go
│   └── cors.go
├── clients/             # External API clients
│   └── youtube.go
├── config/              # Configuration loading
│   └── config.go
├── .env                 # Local environment variables (gitignored)
├── go.mod
└── go.sum
```

### Layered Architecture

```
Routes (routes.go)
    │
    ▼
Handlers (handlers/) — Parse request, validate, call service, format response
    │
    ▼
Services (services/) — Business logic, orchestrates multiple clients/models
    │
    ▼
Clients (clients/) — External API calls (YouTube, etc.)
Models (structs/) — GORM models, database operations
```

**Key Rules:**
1. **Structs are separate** — never mix struct definitions with handler or service code
2. **Handlers are thin** — parse request → validate → call service → return response
3. **Services contain business logic** — filter pipeline, playlist generation, auth
4. **Clients handle external APIs** — YouTube Data API, OAuth providers
5. **Routes in one file** — all endpoints defined in `routes.go`

## Route Conventions

```go
// routes.go
func SetupRoutes(r *gin.Engine, h *handlers.Handler) {
    api := r.Group("/api/v1")
    {
        api.POST("/generate", h.GeneratePlaylist)
        
        auth := api.Group("/auth")
        {
            auth.POST("/google", h.InitiateGoogleAuth)
            auth.POST("/google/callback", h.HandleAuthCallback)
            auth.POST("/refresh", h.RefreshToken)
        }
        
        playlists := api.Group("/playlists")
        playlists.Use(middleware.AuthRequired())
        {
            playlists.POST("", h.CreatePlaylist)
            playlists.GET("/user", h.GetUserPlaylists)
            playlists.GET("/:id", h.GetPlaylist)
            playlists.DELETE("/:id", h.DeletePlaylist)
        }
    }
}
```

## GORM Models

Place in `structs/` package, one file per model:

```go
// structs/user.go
package structs

import "time"

type User struct {
    ID        string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
    Email     string    `gorm:"uniqueIndex;not null"`
    Name      string    `gorm:"not null"`
    AvatarUrl string    `gorm:"column:avatar_url"`
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

## Handler-Service-Client Pattern

```go
// handlers/generate.go
func (h *Handler) GeneratePlaylist(c *gin.Context) {
    var req structs.GenerateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request"})
        return
    }
    
    result, err := h.Service.GeneratePlaylist(req.Query, req.Filters)
    if err != nil {
        // Error handling
        return
    }
    
    c.JSON(200, result)
}
```

```go
// services/youtube.go
func (s *Service) GeneratePlaylist(query string, filters Filters) (*PlaylistResult, error) {
    // 1. Call YouTube API client
    videos, err := s.YouTubeClient.SearchVideos(query, filters)
    
    // 2. Apply filter pipeline
    filtered := s.FilterService.Apply(videos, filters)
    
    // 3. Return result
    return &PlaylistResult{Videos: filtered}, nil
}
```

```go
// clients/youtube.go
func (c *YouTubeClient) SearchVideos(query string, filters Filters) ([]Video, error) {
    // Call YouTube Data API v3
    // Handle rate limits, quota, errors
}
```

## Environment Variables

```env
# YouTube Data API v3
YOUTUBE_API_KEY=your_api_key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/playlist

# Server
PORT=3001
```

## Error Handling

- Use consistent error response format: `{"error": "message", "code": "ERROR_CODE"}`
- Define custom error types in `structs/errors.go`
- Use Gin's `c.Error()` for middleware-based error handling

## Testing

- Tests live alongside source files: `*_test.go`
- Use `testify` for assertions
- Mock YouTube API client for testing
- Use in-memory SQLite or test PostgreSQL for GORM integration tests
