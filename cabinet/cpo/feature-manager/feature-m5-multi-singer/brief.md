# Feature Brief: Multi-Singer Playlist Generation (M5)

## Overview
Add support for generating combined playlists from multiple singers. Users can select up to 5 singers from a curated database of popular artists across genres (Punjabi, Haryanvi, Hindi, Old Hindi, English), and the system will fetch videos for each singer and merge them into a single combined playlist.

## User Story
As a user, I want to select multiple singers (max 5) from different genres and generate a combined YouTube playlist containing songs from all selected artists, so I can create a diverse playlist without manual searching.

## Scope

### In Scope
1. **Singer Database**: PostgreSQL table to store cached singer data (name, genre, thumbnails, popularity metadata)
2. **Seed Data**: Curated list of 100+ popular singers across genres (Punjabi, Haryanvi, Hindi, Old Hindi, English)
3. **Backend API**:
   - `GET /api/v1/singers` — List all singers, filterable by genre, searchable by name
   - `POST /api/v1/generate/multi-singer` — Accepts singer IDs + filters, searches YouTube for each singer, returns combined playlist
4. **Frontend UI**:
   - Tab-based navigation on homepage: "Search" tab (existing) + "Singers" tab (new)
   - Singer selection: Searchable multi-select component with genre filtering, singer thumbnails
   - Max 5 singers constraint with visual feedback
   - Combined playlist generation with per-singer progress indicator
   - "Results per singer" selector (e.g., 5, 10, 15 videos per singer)
5. **Combined Playlist**: Interleaved or sectioned video queue showing which singer contributed which videos

### Out of Scope
- Singer management UI (add/edit/delete singers)
- Scraping from external sources (we'll use seed + manual curation)
- Trending/recommended singers
- Per-singer album/playlist search — we search by singer name + "song"

### Dependencies
- Existing PostgreSQL database (GORM auto-migrate for new Singer model)
- Existing YouTube search API (reused with singer name as query)
- Existing filters (applied per-singer and combined)
- Existing player/queue system (extended for multi-source videos)

## Target Platforms
- Desktop web (primary)
- Mobile web (responsive)

## Success Criteria
- Users can search, select, and generate a combined playlist from 2-5 singers in under 3 clicks
- Combined playlist shows singer attribution for each video
- Per-singer API quota tracked and reported
- Search latency: < 15s for 5 singers (5 × 3 results with filters)
