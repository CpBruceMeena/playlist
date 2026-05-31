# 🧪 M2: Filters & Queue — Test Scenarios

**Product**: YouTube Smart Playlist Creator v1.0
**Feature**: M2 — Filters & Queue
**Date**: May 31, 2026

---

## Scenario 1: First-Time Casual Filtering

**Personas**: Priya (Pragmatic Music Fan), James (Skeptical Casual Listener)

**Goal**: Generate a playlist with basic filters applied

**Steps:**
1. Open the app
2. Type a search query (e.g., "lofi beats")
3. Click "Filters" to expand the filter panel
4. Click "Video Type" → Music, Standard
5. Click "Upload Date" → Past year
6. Click Generate
7. Observe results — are they filtered correctly?

**Acceptance Criteria:**
- Filter panel expands/collapses smoothly
- Video type pills toggle correctly
- Upload date buttons highlight when selected
- Active filter count badge updates
- Results respect all filter criteria

---

## Scenario 2: Advanced Filtering with Keywords

**Personas**: Maya (Power Curator)

**Goal**: Create a precisely curated playlist using advanced filters

**Steps:**
1. Type "jazz hip hop" in search
2. Open Filters
3. Set Duration to "4-10 min" preset
4. Set Video Type to "Music" only
5. Set Upload Date to "Past month"
6. Add "instrumental" to "Must include" keywords
7. Add "remix" to "Exclude" keywords
8. Set Minimum Views to "10K+"
9. Set Max Results to "15"
10. Toggle Safe Search ON
11. Click Generate
12. Verify results match criteria

**Acceptance Criteria:**
- Keyword chips appear and are removable
- Multiple filter types combine correctly
- Min Views dropdown works
- Max Results limits the output
- Safe Search toggle works
- Reset filters clears all selections

---

## Scenario 3: Queue Management & Playback

**Personas**: All three personas

**Goal**: Navigate the playlist page, manage queue, and control playback

**Steps:**
1. Generate a playlist (from any scenario above)
2. Wait for navigation to PlaylistPage
3. Observe the YouTube player
4. Look at the Queue panel on the right
5. Click a video in the queue to change selection
6. If queue has 2+ items, attempt to drag a video to reorder
7. Click the Shuffle button in the queue header
8. Click the Repeat button in the queue header
9. Use player controls: Play/Pause, Next, Previous
10. Adjust volume slider
11. Click on the progress bar to seek

**Acceptance Criteria:**
- Queue shows all videos from the generated playlist
- Clicking a queue item changes the current video
- Drag handle appears when queue has 2+ items
- Shuffle toggles visual state and reorders queue
- Repeat toggles visual state
- All player controls function
- Volume slider works
- Progress bar click-seek works

---

## Scenario 4: Edge Cases

**Personas**: Maya (Power Curator)

**Goal**: Test boundary conditions and error handling

**Steps:**
1. Generate with overly strict filters (e.g., duration <10s + includeKeyword="raretermxyz")
2. Observe behavior with 0 results
3. Generate with `maxResults=50` for large playlist
4. Test with query that returns few results
5. Test rapid clicking of Generate
6. Test toggling shuffle on/off multiple times
7. Test drag reordering with only 1 video (should be disabled)
8. Test repeat=none then repeat=all

**Acceptance Criteria:**
- 0 results shows appropriate empty state (not broken UI)
- Large playlists render correctly in queue
- Rapid clicks don't break the app
- Shuffle unshuffle works correctly
- Drag is disabled for single-item queue
- Repeat mode cycles correctly
