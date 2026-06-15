package middleware

import (
	"bytes"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"

	"playlist-backend/logging"
)

// responseBodyWriter captures the response body for logging
type responseBodyWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *responseBodyWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

// RequestLogger returns a Gin middleware that logs every API request/response.
//
// Log format per request:
//   -> REQ  [ID] METHOD /path (client IP, content length)
//   <- RES  [ID] STATUS duration (response size)
//
// On errors, the response body is logged as well.
func RequestLogger() gin.HandlerFunc {
	logger := logging.GetLogger()

	return func(c *gin.Context) {
		// Request ID for correlating request/response logs
		reqID := fmt.Sprintf("%x", time.Now().UnixNano())[:12]

		start := time.Now()

		// Log incoming request
		path := c.Request.URL.Path
		if c.Request.URL.RawQuery != "" {
			path = path + "?" + c.Request.URL.RawQuery
		}

		logger.Info("--> REQUEST",
			"req_id", reqID,
			"method", c.Request.Method,
			"path", path,
			"client", c.ClientIP(),
			"content_length", c.Request.ContentLength,
		)

		// Wrap response writer to capture the response body
		w := &responseBodyWriter{
			ResponseWriter: c.Writer,
			body:           &bytes.Buffer{},
		}
		c.Writer = w

		// Process the request
		c.Next()

		// Calculate duration
		duration := time.Since(start)

		// Determine if there was an error
		hasError := len(c.Errors) > 0 || c.Writer.Status() >= 400
		statusCode := c.Writer.Status()

		// Log the response
		if hasError {
			// Truncate response body for error logs (can be large)
			respBody := w.body.String()
			if len(respBody) > 500 {
				respBody = respBody[:500] + "... (truncated)"
			}

			logger.Error("<-- RESPONSE ERROR",
				"req_id", reqID,
				"status", statusCode,
				"duration_ms", duration.Milliseconds(),
				"response_size", c.Writer.Size(),
				"response_body", respBody,
			)

			// Log Gin errors too
			for _, e := range c.Errors {
				logger.Error("gin_error",
					"req_id", reqID,
					"error", e.Err,
				)
			}
		} else {
			logger.Info("<-- RESPONSE",
				"req_id", reqID,
				"status", statusCode,
				"duration_ms", duration.Milliseconds(),
				"response_size", c.Writer.Size(),
			)
		}
	}
}
