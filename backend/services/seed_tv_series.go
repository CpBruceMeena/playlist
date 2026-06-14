package services

import (
	"log"

	"gorm.io/gorm"
)

// SeedTVSeries is a no-op in the Go backend.
// TV series seed data is handled by scripts/seed_tv_series.py as an adhoc task.
// Run: python3 scripts/seed_tv_series.py
func SeedTVSeries(db *gorm.DB) error {
	log.Println("ℹ️ TV series seeding is handled by scripts/seed_tv_series.py (adhoc Python script)")
	log.Println("   Run: python3 scripts/seed_tv_series.py")
	return nil
}
