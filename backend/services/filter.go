package services

import (
	"strings"
	"time"

	"playlist-backend/clients"
)

// VideoType classification
type VideoType string

const (
	VideoTypeMusic    VideoType = "music"
	VideoTypeLive     VideoType = "live"
	VideoTypeShorts   VideoType = "shorts"
	VideoTypeStandard VideoType = "standard"
)

// UploadDateRange represents an upload date filter
type UploadDateRange struct {
	Type  string  // "any", "last_week", "last_month", "last_year", "custom"
	Start *string // ISO 8601 date for custom range
	End   *string // ISO 8601 date for custom range
}

type FilterCriteria struct {
	Query           string
	DurationMin     *int
	DurationMax     *int
	VideoTypes      []VideoType
	IncludeKeywords []string
	ExcludeKeywords []string
	UploadDate      *UploadDateRange
	MinViews        *int64
	MaxResults      int
	SafeSearch      bool
}

// FilterService applies filters to a list of YouTube videos
type FilterService struct{}

func NewFilterService() *FilterService {
	return &FilterService{}
}

// ApplyFilters applies all filter criteria to the video list and returns the filtered result
func (s *FilterService) ApplyFilters(videos []clients.VideoDetail, criteria FilterCriteria) []clients.VideoDetail {
	// Apply core filters (duration, types, keywords, views, safeSearch)
	filtered := s.applyCoreFilters(videos, criteria)

	// Apply upload date filter (separate pass for clarity)
	filtered = s.ApplyUploadDateFilter(filtered, criteria)

	// Limit results
	if criteria.MaxResults > 0 && len(filtered) > criteria.MaxResults {
		filtered = filtered[:criteria.MaxResults]
	}

	return filtered
}

// applyCoreFilters applies non-date filters to the video list
func (s *FilterService) applyCoreFilters(videos []clients.VideoDetail, criteria FilterCriteria) []clients.VideoDetail {
	filtered := make([]clients.VideoDetail, 0, len(videos))

	for _, video := range videos {
		if !s.passesFilters(video, criteria) {
			continue
		}
		filtered = append(filtered, video)
	}

	return filtered
}

func (s *FilterService) passesFilters(video clients.VideoDetail, criteria FilterCriteria) bool {
	// Duration filter
	if criteria.DurationMin != nil && video.DurationSeconds < *criteria.DurationMin {
		return false
	}
	if criteria.DurationMax != nil && video.DurationSeconds > *criteria.DurationMax {
		return false
	}

	// Video type filter
	if len(criteria.VideoTypes) > 0 && criteria.VideoTypes[0] != "" {
		videoType := s.ClassifyVideoType(video)
		if !s.videoTypeAllowed(videoType, criteria.VideoTypes) {
			return false
		}
	}

	// Include keywords (video must contain ALL include keywords in title or description)
	if len(criteria.IncludeKeywords) > 0 {
		lowerTitle := strings.ToLower(video.Title)
		lowerDesc := strings.ToLower(video.Description)
		for _, kw := range criteria.IncludeKeywords {
			lowerKw := strings.ToLower(kw)
			if !strings.Contains(lowerTitle, lowerKw) && !strings.Contains(lowerDesc, lowerKw) {
				return false
			}
		}
	}

	// Exclude keywords (video must NOT contain any exclude keywords)
	if len(criteria.ExcludeKeywords) > 0 {
		lowerTitle := strings.ToLower(video.Title)
		lowerDesc := strings.ToLower(video.Description)
		for _, kw := range criteria.ExcludeKeywords {
			lowerKw := strings.ToLower(kw)
			if strings.Contains(lowerTitle, lowerKw) || strings.Contains(lowerDesc, lowerKw) {
				return false
			}
		}
	}

	// Min views filter
	if criteria.MinViews != nil && video.ViewCount < *criteria.MinViews {
		return false
	}

	// SafeSearch — filter out potentially offensive content based on title/description keywords
	if criteria.SafeSearch && containsExplicitContent(video) {
		return false
	}

	return true
}

// ClassifyVideoType determines whether a video is music, live, shorts, or standard
func (s *FilterService) ClassifyVideoType(video clients.VideoDetail) VideoType {
	lowerTitle := strings.ToLower(video.Title)
	lowerDesc := strings.ToLower(video.Description)

	// Detect shorts (vertical video, typically <60s with #shorts)
	if video.DurationSeconds <= 60 {
		if strings.Contains(lowerTitle, "#shorts") ||
			strings.Contains(lowerTitle, "shorts") ||
			strings.Contains(lowerDesc, "#shorts") {
			return VideoTypeShorts
		}
	}

	// Detect live streams
	if strings.Contains(lowerTitle, "live") ||
		strings.Contains(lowerDesc, "live stream") ||
		strings.Contains(lowerTitle, "🔴") ||
		video.DurationSeconds >= 10800 { // 3+ hours is likely a live recording
		return VideoTypeLive
	}

	// Detect music content
	musicKeywords := []string{"song", "audio", "music", "official", "lyrics", "feat", "ft.", "album", "playlist", "remix", "cover"}
	musicScore := 0
	combined := lowerTitle + " " + lowerDesc
	for _, kw := range musicKeywords {
		if strings.Contains(combined, kw) {
			musicScore++
		}
	}
	if musicScore >= 2 {
		return VideoTypeMusic
	}

	// Default
	return VideoTypeStandard
}

func (s *FilterService) videoTypeAllowed(videoType VideoType, allowedTypes []VideoType) bool {
	for _, t := range allowedTypes {
		if t == videoType {
			return true
		}
	}
	return false
}

// containsExplicitContent checks for potentially offensive content
func containsExplicitContent(video clients.VideoDetail) bool {
	explicitTerms := []string{
		"nsfw", "18+", "explicit", "mature",
	}
	combined := strings.ToLower(video.Title + " " + video.Description)
	for _, term := range explicitTerms {
		if strings.Contains(combined, term) {
			return true
		}
	}
	return false
}

// ApplyUploadDateFilter filters videos by upload date range
func (s *FilterService) ApplyUploadDateFilter(videos []clients.VideoDetail, criteria FilterCriteria) []clients.VideoDetail {
	if criteria.UploadDate == nil || criteria.UploadDate.Type == "any" {
		return videos
	}

	var startTime, endTime time.Time
	now := time.Now()

	switch criteria.UploadDate.Type {
	case "last_week":
		startTime = now.AddDate(0, 0, -7)
	case "last_month":
		startTime = now.AddDate(0, -1, 0)
	case "last_year":
		startTime = now.AddDate(-1, 0, 0)
	case "custom":
		if criteria.UploadDate.Start != nil {
			parsed, err := time.Parse(time.RFC3339, *criteria.UploadDate.Start)
			if err != nil {
				return videos // skip filter on parse error
			}
			startTime = parsed
		} else {
			return videos
		}
		if criteria.UploadDate.End != nil {
			parsed, err := time.Parse(time.RFC3339, *criteria.UploadDate.End)
			if err == nil {
				endTime = parsed
			}
		}
	default:
		return videos
	}

	filtered := make([]clients.VideoDetail, 0, len(videos))
	for _, video := range videos {
		publishedAt, err := time.Parse(time.RFC3339, video.PublishedAt)
		if err != nil {
			continue
		}

		if publishedAt.Before(startTime) {
			continue
		}
		if !endTime.IsZero() && publishedAt.After(endTime) {
			continue
		}

		filtered = append(filtered, video)
	}

	return filtered
}

// SuggestRelatedQueries generates related search queries based on a query
// Used to expand the search for more variety
func (s *FilterService) SuggestRelatedQueries(query string) []string {
	return []string{query}
}
