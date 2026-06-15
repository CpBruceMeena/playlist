package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"playlist-backend/structs"
)

const (
	downloadTimeout    = 10 * time.Minute
	downloadServerBase = "http://localhost:5002"
	maxRetries         = 3
)

// DownloadHandler proxies download requests to the Python merge server (also on port 5002)
type DownloadHandler struct {
	client *http.Client
}

func NewDownloadHandler() *DownloadHandler {
	return &DownloadHandler{
		client: &http.Client{
			Timeout: downloadTimeout,
		},
	}
}

// proxyWithRetry sends an HTTP request to the merge server with retries.
// Returns the response body, HTTP status, and any error after all retries.
func (h *DownloadHandler) proxyWithRetry(method, url string, body []byte, ctxTimeout time.Duration) ([]byte, int, error) {
	var lastErr error
	var lastStatusCode int

	for attempt := 1; attempt <= maxRetries; attempt++ {
		var reader io.Reader
		if body != nil {
			reader = bytes.NewReader(body)
		}

		req, err := http.NewRequest(method, url, reader)
		if err != nil {
			lastErr = fmt.Errorf("failed to create request: %w", err)
			break
		}
		req.Header.Set("Content-Type", "application/json")

		// Use a per-attempt context with timeout
		ctx, cancel := context.WithTimeout(context.Background(), ctxTimeout)
		req = req.WithContext(ctx)

		resp, err := h.client.Do(req)
		cancel()

		if err != nil {
			lastErr = fmt.Errorf("request failed: %w", err)
			if attempt < maxRetries {
				wait := time.Duration(1<<uint(attempt)) * time.Second // 2s, 4s, 8s
				log.Printf("[retry] Attempt %d/%d failed, retrying in %v: %v", attempt, maxRetries, wait, err)
				time.Sleep(wait)
			}
			continue
		}
		defer resp.Body.Close()

		respBody, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			lastErr = fmt.Errorf("failed to read response: %w", readErr)
			if attempt < maxRetries {
				wait := time.Duration(1<<uint(attempt)) * time.Second
				log.Printf("[retry] Attempt %d/%d read failed, retrying in %v: %v", attempt, maxRetries, wait, readErr)
				time.Sleep(wait)
			}
			continue
		}

		// Success
		return respBody, resp.StatusCode, nil
	}

	return nil, lastStatusCode, fmt.Errorf("all %d retries exhausted: %w", maxRetries, lastErr)
}

// StartDownload proxies POST /api/downloads to Python server with retry logic
func (h *DownloadHandler) StartDownload(c *gin.Context) {
	var req structs.DownloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "INVALID_REQUEST")
		return
	}

	body, err := json.Marshal(req)
	if err != nil {
		log.Printf("Failed to marshal download request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	proxyURL := downloadServerBase + "/api/downloads"
	respBody, statusCode, err := h.proxyWithRetry("POST", proxyURL, body, downloadTimeout)
	if err != nil {
		log.Printf("Download proxy failed after retries: %v", err)
		apiError(c, http.StatusServiceUnavailable,
			"Download server is unavailable after retries. Make sure the Python merge server is running on port 5002.",
			"SERVER_UNAVAILABLE")
		return
	}

	var proxyResponse struct {
		Data  *structs.DownloadResponse `json:"data,omitempty"`
		Error *struct {
			Message string `json:"message"`
			Code    string `json:"code"`
		} `json:"error,omitempty"`
	}

	if err := json.Unmarshal(respBody, &proxyResponse); err != nil {
		log.Printf("Failed to parse download server response: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	if proxyResponse.Error != nil {
		apiError(c, statusCode, proxyResponse.Error.Message, proxyResponse.Error.Code)
		return
	}

	if proxyResponse.Data != nil {
		apiResponse(c, proxyResponse.Data)
		return
	}

	apiServerError(c, fmt.Errorf("unexpected response from download server"))
}

// ListDownloads proxies GET /api/downloads to Python server
func (h *DownloadHandler) ListDownloads(c *gin.Context) {
	proxyURL := downloadServerBase + "/api/downloads"
	proxyReq, err := http.NewRequestWithContext(c.Request.Context(), "GET", proxyURL, nil)
	if err != nil {
		log.Printf("Failed to create list downloads proxy request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	resp, err := h.client.Do(proxyReq)
	if err != nil {
		log.Printf("Download server list request failed: %v", err)
		apiError(c, http.StatusServiceUnavailable,
			"Download server is unavailable",
			"SERVER_UNAVAILABLE")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read download server list response: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	c.Data(resp.StatusCode, "application/json", respBody)
}

// DeleteDownload proxies DELETE /api/downloads/:id to Python server
func (h *DownloadHandler) DeleteDownload(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		apiError(c, http.StatusBadRequest, "Missing id", "INVALID_REQUEST")
		return
	}

	proxyURL := downloadServerBase + "/api/downloads/" + id
	proxyReq, err := http.NewRequestWithContext(c.Request.Context(), "DELETE", proxyURL, nil)
	if err != nil {
		log.Printf("Failed to create delete download proxy request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	resp, err := h.client.Do(proxyReq)
	if err != nil {
		log.Printf("Download server delete request failed: %v", err)
		apiError(c, http.StatusServiceUnavailable,
			"Download server is unavailable",
			"SERVER_UNAVAILABLE")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read download server delete response: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	c.Data(resp.StatusCode, "application/json", respBody)
}

// ServeDownloadFile serves individual downloaded files
func (h *DownloadHandler) ServeDownloadFile(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		apiError(c, http.StatusBadRequest, "Missing filename", "INVALID_REQUEST")
		return
	}

	// Sanitize to prevent directory traversal
	proxyURL := downloadServerBase + "/api/downloads/" + filename
	proxyReq, err := http.NewRequestWithContext(c.Request.Context(), "GET", proxyURL, nil)
	if err != nil {
		log.Printf("Failed to create download file proxy request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	resp, err := h.client.Do(proxyReq)
	if err != nil {
		log.Printf("Download file request failed: %v", err)
		apiError(c, http.StatusServiceUnavailable,
			"Download server is unavailable",
			"SERVER_UNAVAILABLE")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read download file response: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	// Propagate content-type header and force download
	contentType := resp.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	c.Data(resp.StatusCode, contentType, respBody)
}
