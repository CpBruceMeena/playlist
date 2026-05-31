# Feature Brief: M3 — Save & Share Playlists (LocalStorage)

## Overview
Allow users to save generated playlists locally in the browser (localStorage) so they can return to them later without needing server-side accounts. This replaces the auth-dependent YouTube Export feature that has been put on hold.

## Feature Scope

### In Scope
1. **Save current playlist** — Save the current session's videos + filters to localStorage with a user-given name
2. **View saved playlists** — "My Playlists" page shows all saved playlists as a list with metadata (name, video count, date)
3. **Load saved playlist** — Click a saved playlist to restore it into the player and navigate to the playlist page
4. **Delete saved playlist** — Remove a saved playlist from localStorage
5. **Visual indicators** — Show confirmation toast on save, clear UX for load/delete

### Out of Scope (for now)
- YouTube account export (requires OAuth — on hold)
- Server-side persistence (requires auth)
- Sharing via URL (requires server)
- Cloud sync across devices

## Dependencies
- None — purely client-side, no backend changes
- Relies on existing stores: `playlistStore`, `playerStore`, `toastStore`

## Target Platforms
- Desktop web ✅
- Mobile web ✅

## Acceptance Criteria
1. User can save a playlist with a custom name (default: "My Playlist")
2. Saved playlists appear in "My Playlists" page with name, video count, and date
3. Clicking a saved playlist loads it and navigates to the player
4. User can delete individual playlists
5. Toast confirmation appears on save/delete
6. Data persists across browser sessions (localStorage)
7. Zero console errors
8. TypeScript typecheck passes

## User Stories
- **As a user**, I want to save a playlist I like so I can listen to it later
- **As a user**, I want to see all my saved playlists in one place
- **As a user**, I want to delete playlists I no longer need
- **As a user**, I want visual confirmation when my playlist is saved
