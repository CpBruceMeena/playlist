package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// apiResponse wraps data in { data: ... } to match the TypeScript ApiResponse<T> type
func apiResponse(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{
		"data": data,
	})
}

// apiError returns a structured error response matching the TypeScript ApiError type
func apiError(c *gin.Context, status int, message string, code string) {
	c.JSON(status, gin.H{
		"error": gin.H{
			"message": message,
			"code":    code,
		},
	})
}

// apiServerError is a convenience for 500 errors
func apiServerError(c *gin.Context, err error) {
	apiError(c, http.StatusInternalServerError, "Internal server error", "INTERNAL_ERROR")
	// Log the actual error server-side but don't expose details to client
}
