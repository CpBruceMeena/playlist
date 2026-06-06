package services

import (
	"log"

	"gorm.io/gorm"
)

// SeedSingers is a no-op in the Go backend.
// Singer seed data has been moved to scripts/seed_singers.py as an adhoc task.
// Run: python3 scripts/seed_singers.py
func SeedSingers(db *gorm.DB) error {
	log.Println("ℹ️ Singer seeding is now handled by scripts/seed_singers.py (adhoc Python script)")
	log.Println("   Run: python3 scripts/seed_singers.py")
	return nil
}
