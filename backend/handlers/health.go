package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/structs"
)

type HealthHandler struct {
	DB *gorm.DB
}

func NewHealthHandler(db *gorm.DB) *HealthHandler {
	return &HealthHandler{DB: db}
}

func (h *HealthHandler) Check(c *gin.Context) {
	// Check database connectivity
	dbStatus := "ok"
	if sqlDB, err := h.DB.DB(); err != nil {
		dbStatus = "error"
	} else if err := sqlDB.Ping(); err != nil {
		dbStatus = "error"
	}

	statusCode := http.StatusOK
	if dbStatus != "ok" {
		statusCode = http.StatusServiceUnavailable
	}

	apiResponse(c, structs.HealthResponse{
		Status:    dbStatus,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})

	// Override status code for non-200
	if dbStatus != "ok" {
		c.Status(statusCode)
	}
}
