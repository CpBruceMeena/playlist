# YouTube Audio Extraction — Architecture & Approach

## Overview

Extract audio from YouTube videos and generate simple video files with title overlays. This enables users to save audio separately and create minimal videos (audio + title text) for offline playback or sharing.

## Language Decision

Per the Engineering Backend Language Priority Framework, **Python** is the correct choice for this feature:

| Component | Language | Rationale |
|-----------|----------|-----------|
| **Audio extraction** | **Python** | Audio/video processing is explicitly Python domain (adhoc/utility work) |
| **Video generation** | **Python** | Image manipulation (Pillow) + FFmpeg orchestration — Python ecosystem |
| **API server (optional)** | **Python** | Built-in `http.server` for simple endpoints; can be called by Go backend via subprocess |

## Tools

| Tool | Purpose | Installation |
|------|---------|-------------|
| **yt-dlp** | Download audio track from YouTube URLs | `brew install yt-dlp` |
| **FFmpeg** | Audio format conversion + video generation | `brew install ffmpeg` |
| **Pillow** | Generate title overlay image (avoids FFmpeg `drawtext` dependency) | `pip3 install Pillow` |

> **Why not the YouTube Data API?** The YouTube Data API does not provide audio stream downloads. yt-dlp is a battle-tested tool that handles YouTube's constantly evolving download protocols. It:
> - Extracts the best available audio stream
> - Handles format negotiation, cookies, rate limiting
> - Does not consume YouTube API quota
> - Works with any public YouTube URL

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Two Deployment Modes                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Mode A — Standalone Python API Server                       │
│  ┌──────────────────────────────────────┐                    │
│  │  python3 scripts/extract_audio.py    │                    │
│  │         serve --port 8080            │                    │
│  │                                      │                    │
│  │  POST /extract    → Start job        │                    │
│  │  GET  /status/:id → Poll status      │                    │
│  │  GET  /jobs       → List all jobs    │                    │
│  └──────────────┬───────────────────────┘                    │
│                 │                                            │
│  Mode B — CLI subprocess (called from Go backend)            │
│  ┌──────────────────────────────────────┐                    │
│  │  Go Backend calls via os/exec:       │                    │
│  │  python3 scripts/extract_audio.py    │                    │
│  │    <url> --json                      │                    │
│  │  → Returns structured JSON result    │                    │
│  └──────────────────────────────────────┘                    │
│                                                              │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Python Service Layer                       │
│  scripts/extract_audio.py                                    │
│                                                              │
│  JobManager — manages async jobs with:                       │
│  • Threading.Semaphore (max 3 concurrent)                    │
│  • Job status tracking                                       │
│  • Per-job output isolation in ./output/{job-id}/            │
└──────────────┬──────────────────────────────┬────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐  ┌──────────────────────────┐
│         yt-dlp               │  │         FFmpeg           │
│  yt-dlp -x --audio-format    │  │  -loop 1 -i image.png    │
│  mp3 <url>                   │  │  -i audio.mp3 → video    │
└──────────────┬───────────────┘  └────────────┬─────────────┘
               │                                │
               ▼                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    Output Files                              │
│  ./output/{job-id}/                                          │
│  ├── {title}.mp3           # Extracted audio                 │
│  ├── background.png        # Title overlay image (Pillow)    │
│  └── video.mp4             # Generated video (audio+image)   │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Client sends** a YouTube URL + optional title (via API, CLI, or Go backend)
2. **JobManager** validates URL, creates a job, starts async processing
3. **Stage 1 — Audio Extraction**:
   - Calls `yt-dlp --dump-json` to fetch metadata (title, duration)
   - Calls `yt-dlp -x --audio-format mp3` to download audio
   - Saves audio to `./output/{job-id}/{title}.mp3`
4. **Stage 2 — Video Generation**:
   - Uses Pillow to create a dark background image with centered title text
   - Calls FFmpeg to combine the image (looped) + audio into a video
   - Saves video to `./output/{job-id}/video.mp4`
5. **Returns** job status with file paths

## API Design (Python Server Mode)

### `POST /extract`

**Request:**
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job_a1b2c3d4e5f6",
  "status": "processing",
  "stage": "audio_extraction"
}
```

### `GET /status/:jobId`

**Response:**
```json
{
  "jobId": "job_a1b2c3d4e5f6",
  "status": "completed",
  "audioFile": "./output/job_a1b2c3d4e5f6/song.mp3",
  "videoFile": "./output/job_a1b2c3d4e5f6/video.mp4",
  "duration": 212,
  "error": ""
}
```

### `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "dependencies": {
    "yt-dlp": true,
    "ffmpeg": true,
    "pillow": true
  },
  "missing": []
}
```

## CLI Modes

```bash
# Single job (human-readable output)
python3 scripts/extract_audio.py <url>

# Single job (JSON output — for Go backend integration)
python3 scripts/extract_audio.py <url> --json

# Start HTTP API server
python3 scripts/extract_audio.py serve --port 8080

# Check dependencies
python3 scripts/extract_audio.py check
```

## Error Handling

| Error | Handling |
|-------|----------|
| Invalid YouTube URL | Job fails immediately with validation error |
| yt-dlp failed (private/deleted video) | Job fails with yt-dlp error details |
| FFmpeg failed | Job fails with FFmpeg error details |
| Dependencies not installed | CLI exits with clear install instructions |
| Timeout (> 5 min download) | Subprocess timeout raises exception |

## Security Considerations

1. **Command injection prevention**: All subprocess calls use argument lists (not shell strings). URL and title are never interpolated into shell commands.
2. **Output file isolation**: Each job gets its own directory under `./output/{job-id}/`.
3. **Concurrent jobs**: Threading.Semaphore limits to 3 concurrent extractions.
4. **Cleanup**: Old output files should be cleaned periodically (e.g., cron job for files > 24h).

## File Structure

```
scripts/
└── extract_audio.py          # Python service — CLI, API server, job management

cabinet/cto/engineering/engineering-backend/doc-store/
└── feature-youtube-audio-extraction/
    └── architecture.md       # This document
```

## Next Steps

1. ✅ Install yt-dlp, FFmpeg, Pillow
2. ✅ Python PoC validated end-to-end (audio + video generated)
3. ⬜ Add periodic cleanup for old output files
4. ⬜ Add more sophisticated video templates (gradient backgrounds, multiple text lines)
5. ⬜ Integrate with Go backend via subprocess call (if needed later)
