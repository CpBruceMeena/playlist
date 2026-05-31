package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/clients"
	"playlist-backend/handlers"
	"playlist-backend/middleware"
	"playlist-backend/services"
	"time"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine, db *gorm.DB, ytClient *clients.YouTubeClient) {
	// Initialize services
	filterService := services.NewFilterService()

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)
	generateHandler := handlers.NewGenerateHandler(db, ytClient, filterService)

	// Apply rate limiter (10 requests per minute per IP)
	rateLimiter := middleware.NewRateLimiter(10, 1*time.Minute)
	r.Use(rateLimiter.Middleware())

	// Health check (outside v1 for infrastructure probes)
	r.GET("/api/health", healthHandler.Check)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		v1.POST("/generate", generateHandler.Generate)
	}
}
