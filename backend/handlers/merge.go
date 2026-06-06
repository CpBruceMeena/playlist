package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"

	"playlist-backend/structs"
)

const (
	mergeServerBase = "http://localhost:5002"
	mergeTimeout     = 5 * time.Minute
)

// MergeHandler handles video merge requests by proxying to the Python merge server
type MergeHandler struct {
	client *http.Client
}

func NewMergeHandler() *MergeHandler {
	return &MergeHandler{
		client: &http.Client{
			Timeout: mergeTimeout,
		},
	}
}

// Merge proxies the merge request to the Python merge server
func (h *MergeHandler) Merge(c *gin.Context) {
	var req structs.MergeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "INVALID_REQUEST")
		return
	}

	if len(req.Videos) < 2 {
		apiError(c, http.StatusBadRequest, "At least 2 videos are required for merging", "INVALID_REQUEST")
		return
	}

	// Forward the request to the Python merge server
	body, err := json.Marshal(req)
	if err != nil {
		log.Printf("Failed to marshal merge request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	proxyURL := mergeServerBase + "/api/merge"
	proxyReq, err := http.NewRequestWithContext(c.Request.Context(), "POST", proxyURL, bytes.NewReader(body))
	if err != nil {
		log.Printf("Failed to create proxy request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}
	proxyReq.Header.Set("Content-Type", "application/json")

	resp, err := h.client.Do(proxyReq)
	if err != nil {
		log.Printf("Merge server request failed: %v", err)
		apiError(c, http.StatusServiceUnavailable,
			"Merge server is unavailable. Make sure the Python merge server is running on port 5002.",
			"MERGE_SERVER_UNAVAILABLE")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read merge server response: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	// Forward the response as-is
	var proxyResponse struct {
		Data  *structs.MergeResponse `json:"data,omitempty"`
		Error *struct {
			Message string `json:"message"`
			Code    string `json:"code"`
		} `json:"error,omitempty"`
	}

	if err := json.Unmarshal(respBody, &proxyResponse); err != nil {
		log.Printf("Failed to parse merge server response: %v", err)
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

	apiServerError(c, fmt.Errorf("unexpected response from merge server"))
}

// ListMergedVideos lists all merged videos by proxying to the Python merge server
func (h *MergeHandler) ListMergedVideos(c *gin.Context) {
	proxyURL := mergeServerBase + "/api/merged"
	proxyReq, err := http.NewRequestWithContext(c.Request.Context(), "GET", proxyURL, nil)
	if err != nil {
		log.Printf("Failed to create merged list proxy request: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	resp, err := h.client.Do(proxyReq)
	if err != nil {
		log.Printf("Merge server list request failed: %v", err)
		apiError(c, http.StatusServiceUnavailable,
			"Merge server is unavailable",
			"MERGE_SERVER_UNAVAILABLE")
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Failed to read merge server list response: %v", err)
		apiServerError(c, fmt.Errorf("internal error"))
		return
	}

	c.Data(resp.StatusCode, "application/json", respBody)
}

// ServeMergedFile serves merged video files for playback (not as download)
func (h *MergeHandler) ServeMergedFile(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		apiError(c, http.StatusBadRequest, "Missing filename", "INVALID_REQUEST")
		return
	}

	// Sanitize: prevent directory traversal
	if filepath.Base(filename) != filename {
		apiError(c, http.StatusBadRequest, "Invalid filename", "INVALID_REQUEST")
		return
	}

	// Merged files are stored in project-root/merged/ by the Python server
	mergedDir := "../merged"
	filePath := filepath.Join(mergedDir, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		apiError(c, http.StatusNotFound, "File not found", "NOT_FOUND")
		return
	}

	c.File(filePath) // Serve for playback, not as attachment
}
