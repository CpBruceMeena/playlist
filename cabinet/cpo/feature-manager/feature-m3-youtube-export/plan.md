# 🚀 Feature Plan: M3 — YouTube Export, Video Merge & Publish

**Feature**: Export playlists to YouTube, merge/stitch videos, publish combined video
**Phase**: M3 (replacing original "Accounts" phase)
**Status**: 🟡 Under CPO Review
**Target Completion**: TBD

---

## 1. Executive Summary

The user proposed three connected features that fundamentally change the product direction from "smart playlist creator" to "smart playlist creator + video editor + YouTube publisher." This document analyzes each feature's feasibility, effort, value, and risks.

### Proposed Features

| # | Feature | Description | Value | Effort | Risk |
|---|---------|-------------|-------|--------|------|
| F1 | **Export playlist to YouTube account** | Save a generated playlist as a YouTube playlist on the user's own account via OAuth | High | Medium | Low |
| F2 | **Merge/stitch multiple YouTube videos** | Server-side video processing (FFmpeg) to concatenate downloaded videos into one | Very High | Very High | High (ToS, legal) |
| F3 | **Publish merged video to YouTube** | Upload the stitched video to the user's YouTube channel | High | High | Medium |

---

## 2. Feature Analysis

### F1: Export Playlist to YouTube Account

**Description:** After generating a playlist, user clicks "Export to YouTube" → OAuth consent → YouTube playlist is created and all videos are added.

**Technical Feasibility:** ✅ **HIGH**
- YouTube Data API v3 fully supports `playlists.insert` and `playlistItems.insert`
- Requires OAuth scope: `https://www.googleapis.com/auth/youtube.force-ssl`
- This is the same OAuth infrastructure from the original M3 (Accounts) — lower effort

**Effort Estimate:** ~3-4 days
- Day 1: Add YouTube OAuth scope to auth flow, update consent screen
- Day 2: Create playlist API functions (backend)
- Day 3: Export button + UI flow (frontend)
- Day 4: Integration testing, error handling

**User Value:** High
- Solves the core "save to my YouTube account" request
- Viral loop potential: exported playlists drive awareness
- Priya (Music Fan) would use this frequently

**Risk:** Low
- Well-documented YouTube API
- OAuth already planned for original M3
- Can reuse auth infrastructure

### F2: Merge/Stitch Multiple YouTube Videos

**Description:** Take N videos from a generated playlist, download them server-side, stitch them into a single MP4 file using FFmpeg, and serve the combined result for playback.

**Technical Feasibility:** ⚠️ **MODERATE-LOW**

The **FFmpeg approach** works in theory but has major practical challenges:

1. **Downloading YouTube videos violates YouTube ToS** — Section 8.B of YouTube's Terms of Service explicitly prohibits downloading content unless a download button is provided by YouTube. `youtube-dl` / `yt-dlp` usage for downloading is legally gray and against YouTube ToS.

2. **Server-side video processing is resource-intensive** — FFmpeg re-encoding requires significant CPU/RAM. A 10-video merge (avg 5 min each = 50 min total) would take 5-15 minutes to process on a small server, consuming all available CPU.

3. **Storage requirements** — Each merged video would need temporary storage for the individual downloads + the final output. A 50-min video at 1080p is ~500MB-1GB. This adds significant hosting costs.

4. **Copyright concerns** — Re-encoding and re-hosting YouTube content creates derivative works, which has additional legal implications beyond mere streaming (which the IFrame Player handles compliantly).

5. **Client-side merge via WebCodecs API** — In-browser video recording/merging is possible via MediaRecorder API but:
   - Can only record what's playing in the user's browser (audio only unless using canvas capture)
   - Audio quality degradation
   - User must keep browser tab open during entire playback
   - 50-min playlist = 50 real minutes of recording time

**Effort Estimate:** ~10-14 days (if proceeding with server-side FFmpeg)
- Day 1-2: Research legal/compliance, decide on approach
- Day 3-5: Implement download service (yt-dlp wrapper or similar)
- Day 6-8: FFmpeg concat pipeline
- Day 9-10: Progress tracking, cancelation, error handling
- Day 11-12: Frontend UI (merge button, progress bar, result display)
- Day 13-14: Testing with various video formats/codecs

**User Value:** Very High (if technically feasible)
- Maya (Power Curator) would love this — "create a continuous mix"
- Differentiates from any competitor
- Enables "playlist as a single video" concept

**Risk:** HIGH
| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube ToS violation | Product could be shut down | Legal review before implementation |
| DMCA/copyright liability | Legal action against product | Only process user-uploaded content? |
| High server costs at scale | Unit economics break | Queue processing, limit merges |
| Long processing times | Poor UX | Progress tracking, async processing |
| Video format incompatibility | Processing failures | Strict format validation |

### F3: Publish Merged Video to YouTube

**Description:** After creating a merged video, upload it to the user's YouTube channel.

**Technical Feasibility:** ✅ **HIGH** (assuming F2 is solved)
- YouTube Data API v3 supports `videos.insert` for uploading
- Requires OAuth scope: `https://www.googleapis.com/auth/youtube.upload` or `youtube.force-ssl`
- Standard resumable upload protocol
- Max upload size: 256GB or 12 hours (whichever is less)

**Effort Estimate:** ~3-4 days
- Day 1: Video upload service (backend)
- Day 2: Upload progress tracking (frontend)
- Day 3: Metadata UI (title, description, privacy setting)
- Day 4: Error handling, retry logic, testing

**User Value:** High (combined with F2)
- Full "generate → merge → publish" pipeline
- James (Casual Listener) likely won't use this
- Maya (Power Curator) would be the primary user

**Risk:** Medium
- Upload failures for large files
- YouTube upload quota limits
- Duplicate content flags (if the merged video contains copyrighted material)

---

## 3. CPO Recommendation

### Option A: YouTube Export Only (F1 only) — RECOMMENDED AS MVP

**Phasing:** M3 (immediate)
**Effort:** 3-4 days
**Deliverable:** "Export to YouTube" button on playlist page

This delivers the most value for the least effort and risk. Users can generate a smart playlist, then save it as a YouTube playlist on their account. This is **what most users actually want** — they want to listen to the playlist on YouTube (on any device), not download/merge videos.

### Option B: Export + Merge + Publish (F1 + F2 + F3)

**Phasing:** M3.5 (future, post-MVP)
**Effort:** 16-22 days
**Risks:** YouTube ToS, copyright, server costs, infrastructure complexity

This is a significant product pivot toward video processing/editing. The product would shift from "smart playlist generator" to "playlist generator + video editor + YouTube uploader." This adds substantial surface area for bugs, legal liability, and operational complexity.

### Option C: YouTube Export + Client-Side "Record Mix" (F1 + simplified F2)

**Phasing:** Consider for v2
**Effort:** 6-8 days
**Approach:** Instead of downloading/merging server-side, implement a browser-based "record playlist as audio" feature using the Web Audio API + MediaRecorder. This:
- Records audio from the YouTube IFrame Player as it plays
- Saves as a single audio file
- Less legal risk (no downloading, just recording what user hears)
- Lower processing cost (client-side)
- Limited to audio-only output (no video stitching)

---

## 4. Revised Product Roadmap

### Recommended Phasing

| Phase | Scope | Effort | Priority |
|-------|-------|--------|----------|
| **M3: YouTube Export** | Export playlists to user's YouTube account via OAuth | 3-4 days | 🟢 P0 |
| **M3+: Save/Share** | Save generated playlists on our platform (localStorage for guest, no auth needed) | 2-3 days | 🟡 P1 |
| **M4: Polish** | Error states, responsive, caching, performance | 5-6 days | 🟢 P0 |
| **v1.5: Merge & Publish** | Video merging, YouTube upload, pipeline | ~14 days | 🔵 P2 (Post-MVP) |
| **v2: Full Accounts** | Google OAuth, My Playlists page, cross-device sync | ~7 days | 🔵 P2 (Post-MVP) |

### Auth Decision

**User request: "Remove auth for now and put it on hold"**

Agreed — auth (Google OAuth, user accounts, My Playlists page, shared playlists) is deferred. This eliminates:
- Google OAuth PKCE flow
- JWT token management
- Auth middleware
- My Playlists page
- Shared Playlist page (public view)
- Guest mode import flow

**Saved effort:** ~7 days of development + reduced OAuth maintenance burden

**What we lose:**
- No user accounts = no personalization
- No cross-device playlist access
- No shareable playlist links
- No saved playlist history
- Cannot implement YouTube Export (requires OAuth)

---

## 5. Decision Required

**Which path forward?**

| Option | Scope | Effort | Auth Required? | Risk |
|--------|-------|--------|----------------|------|
| **A** | M3: YouTube Export only | 3-4 days | ✅ Yes (OAuth needed) | Low |
| **B** | M3: Save/Share (no auth) | 2-3 days | ❌ No (localStorage) | Very Low |
| **C** | M3: Both A + B | 5-6 days | ✅ Partial | Low |
| **D** | Skip M3 entirely, go to M4: Polish | 5-6 days | ❌ N/A | None |

**Recommendation:** Option C — implement Save/Share (localStorage-based, no auth) as M3, which allows users to save playlists locally. YouTube Export can be added later when auth is reintroduced.

---

## 6. Next Steps

1. ✅ **Decision on approach** — (Awaiting user confirmation)
2. Update master task list to reflect new roadmap
3. Create feature brief for M3 (Save/Share) or M4 (Polish)
4. Begin implementation based on approved path
