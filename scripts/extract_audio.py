#!/usr/bin/env python3
"""
YouTube Audio Extraction & Video Generation — Python Service

A modular Python service that:
  1. Downloads the best audio stream from a YouTube URL as MP3
  2. Creates a simple video file with a dark background, centered title text, and the audio track

Usage:
    # Activate virtual environment first:
    source .venv/bin/activate

    # CLI mode — single job
    python3 scripts/extract_audio.py https://youtu.be/dQw4w9WgXcQ --title "My Song"

    # JSON output mode (for Go backend integration)
    python3 scripts/extract_audio.py https://youtu.be/dQw4w9WgXcQ --json

    # API server mode
    python3 scripts/extract_audio.py serve --port 8080

Setup:
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r scripts/requirements.txt

System dependencies:
    - yt-dlp (brew install yt-dlp)
    - ffmpeg (brew install ffmpeg)

Output directory structure:
    ./output/{video-id}/
        ├── audio.mp3              # Extracted audio
        ├── background.png         # Title overlay image
        └── video.mp4              # Generated video
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Lazy PIL import — checked in check_dependencies() to avoid crash on missing Pillow
_HAS_PIL = False
try:
    from PIL import Image, ImageDraw, ImageFont  # noqa: F401
    _HAS_PIL = True
except ImportError:
    _HAS_PIL = False


# ═══════════════════════════════════════════════════════════════
#  Job Management
# ═══════════════════════════════════════════════════════════════

class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Job:
    """Represents a single audio extraction + video generation job."""

    def __init__(self, youtube_url: str, title: str = "", output_root: str = "./output"):
        self.id = f"job_{uuid.uuid4().hex[:12]}"
        self.youtube_url = youtube_url
        self.title = title
        self.status = JobStatus.PENDING
        self.stage = ""
        self.audio_file = ""
        self.video_file = ""
        self.duration = 0
        self.error = ""
        self.created_at = datetime.now(timezone.utc).isoformat()
        self._output_dir = Path(output_root) / self.id

    def to_dict(self) -> dict:
        return {
            "jobId": self.id,
            "youtubeUrl": self.youtube_url,
            "title": self.title,
            "status": self.status,
            "stage": self.stage,
            "audioFile": self.audio_file,
            "videoFile": self.video_file,
            "duration": self.duration,
            "error": self.error,
            "createdAt": self.created_at,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


class JobManager:
    """Manages concurrent extraction jobs with status tracking."""

    def __init__(self, output_root: str = "./output", max_concurrent: int = 3):
        self._output_root = output_root
        self._max_concurrent = max_concurrent
        self._semaphore = threading.Semaphore(max_concurrent)
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()

    def start_job(self, youtube_url: str, title: str = "") -> Job:
        job = Job(youtube_url, title, self._output_root)
        with self._lock:
            self._jobs[job.id] = job
        thread = threading.Thread(target=self._process_job, args=(job,), daemon=True)
        thread.start()
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        with self._lock:
            return self._jobs.get(job_id)

    def list_jobs(self) -> list[Job]:
        with self._lock:
            return list(self._jobs.values())

    def _process_job(self, job: Job):
        self._semaphore.acquire()
        try:
            # Step 1: Fetch metadata
            job.status = JobStatus.PROCESSING
            job.stage = "fetching_metadata"
            info = fetch_video_info(job.youtube_url)

            if not job.title:
                job.title = info.get("title", "Untitled")
            job.duration = info.get("duration", 0)

            # Step 2: Download audio
            job.stage = "audio_extraction"
            audio_path = download_audio(job.youtube_url, job._output_dir)
            job.audio_file = str(audio_path)

            # Step 3: Create video
            job.stage = "video_generation"
            video_path = create_video(audio_path, job.title, job.duration, job._output_dir)
            job.video_file = str(video_path)

            job.status = JobStatus.COMPLETED
            job.stage = ""
        except Exception as e:
            job.status = JobStatus.FAILED
            job.error = str(e)
        finally:
            self._semaphore.release()


# ═══════════════════════════════════════════════════════════════
#  Core Functions
# ═══════════════════════════════════════════════════════════════

def check_dependencies() -> list[str]:
    """Verify that all dependencies are available. Returns list of missing tools."""
    missing = []
    for cmd in ["yt-dlp", "ffmpeg"]:
        if not shutil.which(cmd):
            missing.append(cmd)
    if not _HAS_PIL:
        missing.append("Pillow (pip3 install Pillow)")
    return missing


def extract_youtube_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r"(?:youtube\.com/watch\?.*v=)([a-zA-Z0-9_-]{11})",
        r"(?:youtu\.be/)([a-zA-Z0-9_-]{11})",
        r"(?:youtube\.com/embed/)([a-zA-Z0-9_-]{11})",
        r"(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract video ID from URL: {url}")


def fetch_video_info(url: str) -> dict:
    """Fetch video metadata using yt-dlp (title, duration, etc.)."""
    result = subprocess.run(
        ["yt-dlp", "--dump-json", "--no-playlist", url],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        raise RuntimeError(f"yt-dlp failed: {result.stderr}")

    info = json.loads(result.stdout.strip().split("\n")[0])
    return info


def download_audio(url: str, output_dir: Path) -> Path:
    """Download the best audio stream as MP3 using yt-dlp."""
    output_dir.mkdir(parents=True, exist_ok=True)
    output_template = str(output_dir / "%(title)s.%(ext)s")

    # Predict the filename first
    filename_result = subprocess.run(
        ["yt-dlp", "--print", "filename", "-o", output_template, "--no-playlist", url],
        capture_output=True, text=True, timeout=30
    )
    predicted_path = None
    if filename_result.returncode == 0:
        predicted = filename_result.stdout.strip().split("\n")[-1]
        predicted_path = Path(predicted)

    # Actually download
    result = subprocess.run(
        ["yt-dlp", "-x", "--audio-format", "mp3", "--audio-quality", "0",
         "--output", output_template, "--no-playlist", url],
        capture_output=True, text=True, timeout=300
    )
    if result.returncode != 0:
        raise RuntimeError(f"Audio download failed: {result.stderr}")

    # Find the actual file
    if predicted_path and predicted_path.exists():
        return predicted_path

    # Fallback: most recently modified file in directory
    files = sorted(output_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)
    if files:
        return files[0]

    raise FileNotFoundError(f"No audio file found in {output_dir}")


def create_title_image(title: str, output_dir: Path, width: int = 1920, height: int = 1080) -> Path:
    """Create a background image with centered title text using Pillow."""
    img_path = output_dir / "background.png"

    img = Image.new("RGB", (width, height), (26, 26, 46))
    draw = ImageDraw.Draw(img)

    # Try system fonts
    font = None
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/SFNSDisplay.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, 64)
                break
            except Exception:
                continue

    if font is None:
        font = ImageFont.load_default()

    # Scale font to fit within image width
    max_width = width - 200
    if hasattr(font, 'path'):
        for size in range(64, 20, -2):
            try:
                test_font = ImageFont.truetype(font.path, size)
            except Exception:
                continue
            bbox = draw.textbbox((0, 0), title, font=test_font)
            if (bbox[2] - bbox[0]) <= max_width:
                font = test_font
                break

    # Center the text
    bbox = draw.textbbox((0, 0), title, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2

    # Draw shadow + text
    draw.text((x + 3, y + 3), title, font=font, fill=(0, 0, 0))
    draw.text((x, y), title, font=font, fill=(255, 255, 255))

    img.save(img_path, "PNG")
    return img_path


def create_video(audio_path: Path, title: str, duration: int, output_dir: Path) -> Path:
    """Create a video from the title image + audio track using FFmpeg."""
    title_img = create_title_image(title, output_dir)
    video_path = output_dir / "video.mp4"

    result = subprocess.run(
        ["ffmpeg", "-y",
         "-loop", "1", "-i", str(title_img),
         "-i", str(audio_path),
         "-c:v", "libx264", "-preset", "fast", "-crf", "23",
         "-c:a", "aac", "-pix_fmt", "yuv420p", "-shortest",
         str(video_path)],
        capture_output=True, text=True, timeout=600
    )
    if result.returncode != 0:
        raise RuntimeError(f"Video generation failed: {result.stderr[:2000]}")

    return video_path





# ═══════════════════════════════════════════════════════════════
#  Simple HTTP API Server (optional, for backend integration)
# ═══════════════════════════════════════════════════════════════

def run_api_server(host: str = "127.0.0.1", port: int = 8080):
    """Run a minimal HTTP API server using Python's built-in http.server.

    Endpoints:
        POST /extract   — Start a job { "youtubeUrl": "...", "title": "..." }
        GET  /status/:id — Get job status
        GET  /jobs       — List all jobs
    """
    from http.server import HTTPServer, BaseHTTPRequestHandler

    manager = JobManager()

    class APIHandler(BaseHTTPRequestHandler):
        def _send_json(self, data: dict, status: int = 200):
            body = json.dumps(data).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _read_body(self) -> dict:
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                return {}
            return json.loads(self.rfile.read(length))

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

        def do_POST(self):
            if self.path == "/extract":
                body = self._read_body()
                url = body.get("youtubeUrl", "")
                title = body.get("title", "")

                if not url:
                    self._send_json({"error": "youtubeUrl is required"}, 400)
                    return

                try:
                    job = manager.start_job(url, title)
                    self._send_json({
                        "jobId": job.id,
                        "status": job.status,
                        "stage": "audio_extraction",
                    }, 202)
                except Exception as e:
                    self._send_json({"error": str(e)}, 400)
            else:
                self._send_json({"error": "Not found"}, 404)

        def do_GET(self):
            if self.path.startswith("/status/"):
                job_id = self.path[len("/status/"):].rstrip("/")
                job = manager.get_job(job_id)
                if not job:
                    self._send_json({"error": "Job not found"}, 404)
                else:
                    self._send_json(job.to_dict())
            elif self.path == "/jobs":
                jobs = [j.to_dict() for j in manager.list_jobs()]
                self._send_json({"jobs": jobs})
            elif self.path == "/health":
                missing = check_dependencies()
                self._send_json({
                    "status": "healthy" if not missing else "degraded",
                    "dependencies": {
                        "yt-dlp": shutil.which("yt-dlp") is not None,
                        "ffmpeg": shutil.which("ffmpeg") is not None,
                        "pillow": True,
                    },
                    "missing": missing,
                })
            else:
                self._send_json({"error": "Not found"}, 404)

        def log_message(self, format, *args):
            sys.stderr.write(f"[API] {args[0]} {args[1]} {args[2]}\n")

    server = HTTPServer((host, port), APIHandler)
    print(f"🎵 Audio Extraction API server running on http://{host}:{port}")
    print(f"   POST /extract    — Start a job")
    print(f"   GET  /status/:id — Check job status")
    print(f"   GET  /jobs       — List all jobs")
    print(f"   GET  /health     — Health check")
    print()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


# ═══════════════════════════════════════════════════════════════
#  CLI
# ═══════════════════════════════════════════════════════════════

def main():
    """
    Entry point with manual mode detection to avoid argparse subparser issues.

    Modes:
        python3 scripts/extract_audio.py <url>            — Extract (human output)
        python3 scripts/extract_audio.py <url> --title X  — Extract with custom title
        python3 scripts/extract_audio.py <url> --json      — Extract (JSON output)
        python3 scripts/extract_audio.py serve             — HTTP API server
        python3 scripts/extract_audio.py check             — Check dependencies
    """
    # Detect mode from argv[1]
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print("""🎵 YouTube Audio Extraction & Video Generation Service

Usage:
  python3 scripts/extract_audio.py <url>                   Extract audio + generate video
  python3 scripts/extract_audio.py <url> --title "Name"    Custom title
  python3 scripts/extract_audio.py <url> --json            JSON output (for programmatic use)
  python3 scripts/extract_audio.py serve [--port PORT]     Start HTTP API server
  python3 scripts/extract_audio.py check                   Check dependencies

Examples:
  python3 scripts/extract_audio.py https://youtu.be/dQw4w9WgXcQ
  python3 scripts/extract_audio.py https://youtu.be/dQw4w9WgXcQ --json
  python3 scripts/extract_audio.py serve --port 8080
""")
        sys.exit(0 if len(sys.argv) < 2 else 1)

    mode = sys.argv[1]

    if mode == "serve":
        # Parse serve args
        import getopt
        host = "127.0.0.1"
        port = 8080
        try:
            opts, _ = getopt.getopt(sys.argv[2:], "", ["host=", "port="])
            for opt, val in opts:
                if opt == "--host":
                    host = val
                elif opt == "--port":
                    port = int(val)
        except getopt.GetoptError as e:
            print(f"❌ Error parsing serve options: {e}")
            print("Usage: python3 scripts/extract_audio.py serve [--host HOST] [--port PORT]")
            sys.exit(1)
        except ValueError:
            print(f"❌ Invalid port value")
            sys.exit(1)

        missing = check_dependencies()
        if missing:
            print(f"❌ Missing dependencies: {', '.join(missing)}")
            print(f"   Install: brew install {' '.join(missing)}")
            sys.exit(1)
        run_api_server(host, port)
        return

    if mode == "check":
        missing = check_dependencies()
        if missing:
            print(f"❌ Missing: {', '.join(missing)}")
            sys.exit(1)
        print("✅ All dependencies available")
        for cmd in ["yt-dlp", "ffmpeg"]:
            ver = subprocess.run([cmd, "--version"], capture_output=True, text=True, timeout=5)
            print(f"   ✓ {ver.stdout.split(chr(10))[0]}")
        return

    # Default: treat first arg as a URL
    url = mode
    title = ""
    output_dir = "./output"
    json_output = False

    # Parse remaining args
    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--title" and i + 1 < len(sys.argv):
            title = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--json":
            json_output = True
            i += 1
        elif sys.argv[i] in ("-o", "--output-dir") and i + 1 < len(sys.argv):
            output_dir = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    # Check deps
    missing = check_dependencies()
    if missing:
        print(f"❌ Missing dependencies: {', '.join(missing)}")
        print(f"   Install: brew install {' '.join(missing)}")
        sys.exit(1)

    # Validate URL
    try:
        video_id = extract_youtube_id(url)
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)

    info = fetch_video_info(url)
    title = title or info.get("title", "Untitled")
    duration = info.get("duration", 0)

    if json_output:
        manager = JobManager(output_dir)
        job = manager.start_job(url, title)
        while job.status in (JobStatus.PENDING, JobStatus.PROCESSING):
            time.sleep(0.5)
        print(job.to_json())
    else:
        out_dir = Path(output_dir) / video_id
        out_dir.mkdir(parents=True, exist_ok=True)

        print("=" * 60)
        print("  🎵 YouTube Audio Extraction")
        print("=" * 60)
        print(f"  📹 {title}")
        print(f"  ⏱  {duration}s ({duration // 60}:{duration % 60:02d})")
        print(f"  📁 Output: {out_dir}")
        print()

        print("🎵 Downloading audio...")
        audio_path = download_audio(url, out_dir)
        print(f"   ✅ {audio_path.name} ({audio_path.stat().st_size / 1024 / 1024:.1f} MB)")

        print("🎬 Creating video...")
        video_path = create_video(audio_path, title, duration, out_dir)
        print(f"   ✅ {video_path.name} ({video_path.stat().st_size / 1024 / 1024:.1f} MB)")

        print()
        print("=" * 60)
        print("  ✅ Done!")
        print(f"     Audio: {audio_path}")
        print(f"     Video: {video_path}")
        print("=" * 60)


if __name__ == "__main__":
    main()
