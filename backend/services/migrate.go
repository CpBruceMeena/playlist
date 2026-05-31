package services

import (
	"log"

	"gorm.io/gorm"

	"playlist-backend/structs"
)

// TableDefinition defines a table to create if it doesn't exist
type TableDefinition struct {
	Model    interface{}
	SeedFunc func(db *gorm.DB) error // Optional seed function, called if table was just created or is empty
}

// EnsureTables creates all tables if they don't exist, then runs conditional seed functions
func EnsureTables(db *gorm.DB) error {
	migrator := db.Migrator()

	tables := []TableDefinition{
		{Model: &structs.User{}},
		{Model: &structs.Playlist{}},
		{Model: &structs.PlaylistVideo{}},
		{Model: &structs.Singer{}, SeedFunc: SeedSingers},
		{Model: &structs.YouTubeCache{}},
	}

	for _, table := range tables {
		modelName := getModelName(table.Model)

		if !migrator.HasTable(table.Model) {
			if err := migrator.CreateTable(table.Model); err != nil {
				log.Printf("Failed to create table for %s: %v", modelName, err)
				return err
			}
			log.Printf("✅ Created table: %s", modelName)
		} else {
			log.Printf("✓ Table already exists: %s", modelName)
		}
	}

	// Run seed functions for tables that need data
	for _, table := range tables {
		if table.SeedFunc != nil {
			if err := table.SeedFunc(db); err != nil {
				log.Printf("Warning: seed failed for %s: %v", getModelName(table.Model), err)
			}
		}
	}

	return nil
}

func getModelName(model interface{}) string {
	switch model.(type) {
	case *structs.User:
		return "users"
	case *structs.Playlist:
		return "playlists"
	case *structs.PlaylistVideo:
		return "playlist_videos"
	case *structs.Singer:
		return "singers"
	case *structs.YouTubeCache:
		return "youtube_cache"
	default:
		return "unknown"
	}
}
