package handlers

import (
	"bytes"
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
	downloadTimeout = 10 * time.Minute
	downloadServerBase      = "http://localhost:5002"
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

// StartDownload proxies POST /api/downloads to Python server
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
	proxyReq, err := http.NewRequestWithContext(c.Request.Context(), "POST", proxyURL, bytes.NewReader(body))
	if err != nil {
		log.Printf("Failed to create download proxy request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}
	proxyReq.Header.Set("Content-Type", "application/json")

	resp, err := h.client.Do(proxyReq)
	if err != nil {
		log.Printf("Download server request failed: %v", err)
		apiError(c, http.StatusServiceUnavailable,
			"Download server is unavailable. Make sure the Python merge server is running on port 5002.",
			"SERVER_UNAVAILABLE")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read download server response: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
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
		apiError(c, resp.StatusCode, proxyResponse.Error.Message, proxyResponse.Error.Code)
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
