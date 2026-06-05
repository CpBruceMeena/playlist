package structs

import (
	"time"

	"gorm.io/gorm"
)

// User matches the Prisma User model
type User struct {
	ID        string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email     string `gorm:"uniqueIndex;not null"`
	Name      string `gorm:"not null"`
	GoogleID  string `gorm:"uniqueIndex;column:google_id;not null"`
	AvatarURL string `gorm:"column:avatar_url"`

	Playlists []Playlist `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`

	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (User) TableName() string {
	return "users"
}

// Playlist matches the Prisma Playlist model
type Playlist struct {
	ID        string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    string `gorm:"type:uuid;column:user_id;index"`
	User      User   `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Name      string `gorm:"type:varchar(255);not null"`
	Query     string `gorm:"type:varchar(500);not null"`
	QueryHash string `gorm:"type:varchar(50);column:query_hash;uniqueIndex:idx_query_hash"`
	Filters   string `gorm:"type:jsonb;default:'{}'"`

	Videos []PlaylistVideo `gorm:"foreignKey:PlaylistID;constraint:OnDelete:CASCADE"`

	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (Playlist) TableName() string {
	return "playlists"
}

// PlaylistVideo matches the Prisma PlaylistVideo model
type PlaylistVideo struct {
	ID              string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	PlaylistID      string `gorm:"type:uuid;column:playlist_id;index:idx_pv_playlist_pos,priority:1"`
	Playlist        Playlist `gorm:"foreignKey:PlaylistID;constraint:OnDelete:CASCADE"`
	YoutubeID       string `gorm:"type:varchar(50);column:youtube_id;not null"`
	Title           string `gorm:"type:varchar(500);not null"`
	Channel         string `gorm:"type:varchar(255);not null"`
	ChannelID       string `gorm:"type:varchar(100);column:channel_id"`
	Thumbnail       string `gorm:"type:varchar(500)"`
	DurationSeconds int    `gorm:"column:duration_seconds"`
	ViewCount       int64  `gorm:"column:view_count"`
	Position        int    `gorm:"not null;index:idx_pv_playlist_pos,priority:2"`

	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`
}

func (PlaylistVideo) TableName() string {
	return "playlist_videos"
}

// Singer represents a curated singer/artist
// Stored in DB for quick access and selection
type Singer struct {
	ID               string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name             string `gorm:"type:varchar(255);not null;index:idx_singers_name" json:"name"`
	Genre            string `gorm:"type:varchar(100);not null;index:idx_singers_genre" json:"genre"`
	ThumbnailURL     string `gorm:"type:varchar(500);column:thumbnail_url" json:"thumbnailUrl"`
	YouTubeChannelID string `gorm:"type:varchar(100);column:youtube_channel_id" json:"youtubeChannelId"`
	Description      string `gorm:"type:text" json:"description"`
	PopularityScore  int    `gorm:"column:popularity_score;default:0" json:"popularityScore"`
	IsActive         bool   `gorm:"column:is_active;default:true" json:"isActive"`

	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"-"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"-"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Singer) TableName() string {
	return "singers"
}

// YouTubeCache stores YouTube API responses for testing/rate-limit fallback
type YouTubeCache struct {
	ID            string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CacheKey      string    `gorm:"type:varchar(500);uniqueIndex:idx_cache_key;not null" json:"-"`
	CacheType     string    `gorm:"type:varchar(50);not null;index:idx_cache_type" json:"-"`
	ResponseJSON  string    `gorm:"type:jsonb;not null" json:"-"`
	QuotaUsed     int       `gorm:"column:quota_used;default:0" json:"-"`
	HitCount      int       `gorm:"column:hit_count;default:0" json:"-"`

	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"-"`
	ExpiresAt time.Time `gorm:"column:expires_at;not null;index:idx_cache_expires" json:"-"`
}

func (YouTubeCache) TableName() string {
	return "youtube_cache"
}

// SavedSong stores user-saved songs
// Uses an in-memory store (no DB table migration needed)
type SavedSong struct {
	ID              string `json:"id"`
	VideoID         string `json:"videoId"`
	Title           string `json:"title"`
	ChannelTitle    string `json:"channelTitle"`
	ThumbnailURL    string `json:"thumbnailUrl"`
	Duration        string `json:"duration"`
	DurationSeconds int    `json:"durationSeconds"`
	SingerName      string `json:"singerName"`
	SingerID        string `json:"singerId"`
	CreatedAt       string `json:"createdAt"`
}

