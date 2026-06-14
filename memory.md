# Project State

## Git Status
6ab353a feat: My Songs page, merge ordering dialog, saved songs/merged videos stores, backend merge route, Python merge server, .gitignore cleanup
6eecb7e fix: merge order dialog starts empty, tap to build order; ignore ui_design/ exports
bc28439 Clean up POC Song Library and Merge feature (M6)
fde2915 Restore shorts/live as optional video types (not selected by default)
9a1db9b Fix YouTube playback, singer chips, back button, header redesign, and update README

?? memory.md

## Git Hooks
- Located in `.githooks/` (committed to repo, configured via `git config core.hooksPath .githooks`)
- **pre-commit**: Blocks commits on `main`/`master` — use `git commit --no-verify` to bypass
- **pre-push**: Blocks pushes to `main`/`master` — use `git push --no-verify` to bypass
- All new clones must run: `git config core.hooksPath .githooks`

## Running Services
- Frontend: 39301
40628
running (port 5173)
- Backend: 40601
40628
running (port 3001)
- Merge Server: 40596
40601
running (port 5002)

## Project Structure
- Frontend: Vite React app at /frontend
- Backend: Go server at /backend
- Merge Server: Python Flask at /scripts/merge_server.py

## Key Files
- Merge order dialog: frontend/src/components/processing/MergeOrderDialog.tsx
- My Songs page: frontend/src/pages/MySongsPage.tsx
- Merged Videos page: frontend/src/pages/MergedVideosPage.tsx
- Background merge runner: frontend/src/api/mergeRunner.ts
- Merge API: frontend/src/api/merge.ts
- Saved songs store: frontend/src/stores/savedSongsStore.ts
- Merged videos store: frontend/src/stores/mergedVideosStore.ts
- Queue (selection mode): frontend/src/components/player/QueueList.tsx

## Branch
feature-android-app

## Android App
- Location: /mobile
- Status: QA PASSED — No crashes, all API connections working
- APK: mobile/app/build/outputs/apk/debug/app-debug.apk (58MB)
- Unit Tests: 20 passing (JUnit + Mockk + Turbine)
- API base: https://helpful-supposedly-moose.ngrok-free.app/api/v1/
- Backend Port: 3001 (default), ngrok tunnels to this
- Theme: Obsidian Neon (dark, glassmorphism, violet/cyan)
- Screens: Home, Singers, Playlists, Player, Songs (coming soon), Merge
- No local database — all data via backend API
- Nginx config: mobile/nginx.conf (routes Go 8080 + Python 5002)
- Docs: cabinet/cpo/feature-manager/feature-android-app/

## QA Findings (2026-06-05)
### Fixed Bugs
1. Retrofit crash: `baseUrl` missing trailing slash → added `/`
2. NullPointerException on Singers screen: Backend wraps all responses in `{ data: ... }` but DTOs expected top-level fields → added `ApiResponseDto<T>` wrapper across all 9 API endpoints
3. Playlists list crash: `{ data: { playlists: [...] } }` format mismatched `{ data: [...] }` expectation → added `PlaylistListResponseDto`

### Verified Working
- ✅ Backend connectivity via ngrok (200 OK)
- ✅ App launches without crash
- ✅ Singers tab loads singer list from API
- ✅ Playlists tab loads playlist list from API
- ✅ Navigation through Home→Singers→Playlists
- ✅ No FATAL EXCEPTION after navigation
- ✅ `./gradlew test` — BUILD SUCCESSFUL
- ✅ `./gradlew assembleDebug` — BUILD SUCCESSFUL
