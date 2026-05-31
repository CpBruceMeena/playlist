package services

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"gorm.io/gorm"

	"playlist-backend/clients"
	"playlist-backend/structs"
)

// CacheService manages YouTube API response caching in the database
// Used for testing purposes — serves cached results when API is rate-limited
type CacheService struct {
	DB *gorm.DB
}

func NewCacheService(db *gorm.DB) *CacheService {
	return &CacheService{DB: db}
}

// CacheTTL is how long cached entries remain valid (default 1 hour)
const CacheTTL = 1 * time.Hour

// CacheKey generates a deterministic cache key from the components
// CacheKey generates a deterministic cache key from the parts
func CacheKey(parts ...string) string {
	hash := sha256.Sum256([]byte(fmt.Sprintf("%v", parts)))
	return fmt.Sprintf("%x", hash[:16])
}

// GetCachedResult retrieves a cached YouTube response if available and not expired
func (s *CacheService) GetCachedResult(cacheKey string) ([]clients.VideoDetail, *int, error) {
	var entry structs.YouTubeCache
	err := s.DB.Where("cache_key = ? AND expires_at > ?", cacheKey, time.Now()).
		First(&entry).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil, nil
		}
		return nil, nil, fmt.Errorf("failed to query cache: %w", err)
	}

	// Increment hit count
	s.DB.Model(&entry).UpdateColumn("hit_count", gorm.Expr("hit_count + 1"))

	// Parse the cached response
	var videos []clients.VideoDetail
	if err := json.Unmarshal([]byte(entry.ResponseJSON), &videos); err != nil {
		log.Printf("Warning: failed to unmarshal cached response for key %s: %v", cacheKey, err)
		// Delete corrupted entry
		s.DB.Delete(&entry)
		return nil, nil, nil
	}

	log.Printf("📦 Cache HIT for key %s (type: %s, quota: %d)", cacheKey[:12], entry.CacheType, entry.QuotaUsed)
	return videos, &entry.QuotaUsed, nil
}

// SetCachedResult stores a YouTube response in the cache
func (s *CacheService) SetCachedResult(cacheKey, cacheType string, videos []clients.VideoDetail, quotaUsed int) error {
	jsonData, err := json.Marshal(videos)
	if err != nil {
		return fmt.Errorf("failed to marshal cache response: %w", err)
	}

	entry := structs.YouTubeCache{
		CacheKey:     cacheKey,
		CacheType:    cacheType,
		ResponseJSON: string(jsonData),
		QuotaUsed:    quotaUsed,
		ExpiresAt:    time.Now().Add(CacheTTL),
	}

	// Upsert — replace if cache_key already exists
	if err := s.DB.Where("cache_key = ?", cacheKey).Delete(&structs.YouTubeCache{}).Error; err != nil {
		return fmt.Errorf("failed to clear old cache entry: %w", err)
	}

	if err := s.DB.Create(&entry).Error; err != nil {
		return fmt.Errorf("failed to insert cache entry: %w", err)
	}

	log.Printf("📦 Cached result for key %s (type: %s, videos: %d, quota: %d)", cacheKey[:12], cacheType, len(videos), quotaUsed)
	return nil
}

// IsRateLimited checks if the YouTube client returned a rate limit error
// or if we've used too much quota recently (simple heuristic for testing)
func IsRateLimited(err error) bool {
	if err == nil {
		return false
	}
	errStr := err.Error()
	return strings.Contains(errStr, "rateLimitExceeded") ||
		strings.Contains(errStr, "quotaExceeded") ||
		strings.Contains(errStr, "403") ||
		strings.Contains(errStr, "429")
}

// GenerateSearchCacheKey creates a unique cache key for a regular playlist generation
func GenerateSearchCacheKey(query string, maxResults int) string {
	return CacheKey("search", query, fmt.Sprintf("%d", maxResults))
}

// GenerateMultiSingerCacheKey creates a unique cache key for multi-singer generation
func GenerateMultiSingerCacheKey(singerIDs []string, resultsPerSinger int) string {
	// Sort singer IDs for deterministic key
	sorted := make([]string, len(singerIDs))
	copy(sorted, singerIDs)
	// Simple sort (bubble sort for small slices)
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[i] > sorted[j] {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	return CacheKey("multi-singer", fmt.Sprintf("%v", sorted), fmt.Sprintf("%d", resultsPerSinger))
}

// PurgeExpiredCache removes all expired cache entries
func (s *CacheService) PurgeExpiredCache() error {
	result := s.DB.Where("expires_at <= ?", time.Now()).Delete(&structs.YouTubeCache{})
	if result.Error != nil {
		return fmt.Errorf("failed to purge expired cache: %w", result.Error)
	}
	if result.RowsAffected > 0 {
		log.Printf("🧹 Purged %d expired cache entries", result.RowsAffected)
	}
	return nil
}
