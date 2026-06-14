package middleware

import (
	"net/http"
	"sync"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// RateLimiter provides simple in-memory rate limiting per IP
type RateLimiter struct {
	mu       sync.Mutex
	requests map[string]*rateEntry
	limit    int
	window   time.Duration
}

type rateEntry struct {
	count    int
	resetAt  time.Time
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string]*rateEntry),
		limit:    limit,
		window:   window,
	}

	// Clean up old entries every minute
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		for range ticker.C {
			rl.mu.Lock()
			now := time.Now()
			for ip, entry := range rl.requests {
				if now.After(entry.resetAt) {
					delete(rl.requests, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only rate limit API endpoints
		if c.Request.URL.Path == "/playlist/api/health" {
			c.Next()
			return
		}

		ip := c.ClientIP()
		now := time.Now()

		rl.mu.Lock()
		entry, exists := rl.requests[ip]

		if !exists || now.After(entry.resetAt) {
			// New window
			rl.requests[ip] = &rateEntry{
				count:   1,
				resetAt: now.Add(rl.window),
			}
			rl.mu.Unlock()
			c.Next()
			return
		}

		if entry.count >= rl.limit {
			rl.mu.Unlock()
			retryAfter := int(time.Until(entry.resetAt).Seconds())
			c.Header("Retry-After", "10")
			c.Header("X-RateLimit-Limit", "10")
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", strconv.Itoa(retryAfter))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{
					"message": "Rate limit exceeded. Try again in a moment.",
					"code":    "RATE_LIMIT_EXCEEDED",
				},
			})
			c.Abort()
			return
		}

		entry.count++
		rl.mu.Unlock()

		remaining := rl.limit - entry.count
		c.Header("X-RateLimit-Limit", "10")
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))

		c.Next()
	}
}
