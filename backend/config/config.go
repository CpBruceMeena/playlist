package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	DatabaseURL   string
	YouTubeAPIKey string
	ClientURL     string
}

func Load() (*Config, error) {
	// Load .env file (ignore error if it doesn't exist in production)
	_ = godotenv.Load()

	cfg := &Config{
		Port:          getEnv("PORT", "3001"),
		DatabaseURL:   getEnv("DATABASE_URL", "host=localhost user=postgres password=password dbname=playlist port=5432 sslmode=disable"),
		YouTubeAPIKey: getEnv("YOUTUBE_API_KEY", ""),
		ClientURL:     getEnv("CLIENT_URL", "http://localhost:5173"),
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
