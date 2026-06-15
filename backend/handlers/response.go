package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"playlist-backend/logging"
)

// apiResponse sends a success response.
// Request/response logging is handled by the RequestLogger middleware.
func apiResponse(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{
		"data": data,
	})
}

// apiError returns a structured error response matching the TypeScript ApiError type
func apiError(c *gin.Context, status int, message string, code string) {
	// Log the error with context
	logging.GetLogger().Warn("API error",
		"endpoint", c.FullPath(),
		"method", c.Request.Method,
		"status", status,
		"code", code,
		"message", message,
	)

	c.JSON(status, gin.H{
		"error": gin.H{
			"message": message,
			"code":    code,
		},
	})
}

// apiServerError is a convenience for 500 errors
func apiServerError(c *gin.Context, err error) {
	logging.GetLogger().Error("API server error",
		"endpoint", c.FullPath(),
		"method", c.Request.Method,
		"error", err.Error(),
		"type", fmt.Sprintf("%T", err),
	)

	apiError(c, http.StatusInternalServerError, "Internal server error", "INTERNAL_ERROR")
}
