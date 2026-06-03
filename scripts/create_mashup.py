#!/usr/bin/env python3
"""
YouTube Audio Mashup Creator — Remotion Integration

Orchestrates the full pipeline:
  1. Download audio from multiple YouTube URLs
  2. Build track configuration JSON for Remotion
  3. Copy audio files to Remotion's public/ directory
  4. Call Remotion CLI to render the final video

Usage:
    python3 scripts/create_mashup.py <url1> <url2> [--title1 "Custom Title 1"] [--title2 "Custom Title 2"]

Dependencies:
    - yt-dlp (brew install yt-dlp)
    - ffmpeg (brew install ffmpeg)
    - Pillow (pip install Pillow) — for audio extraction
    - Node.js + Remotion project in video/

Remotion project setup:
    cd video && npm install && cd ..

Output:
    ./output/mashup/video.mp4
"""

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
VIDEO_DIR = PROJECT_ROOT / "video"
OUTPUT_DIR = PROJECT_ROOT / "output" / "mashup"
PUBLIC_DIR = VIDEO_DIR / "public"
SCRIPT_DIR = Path(__file__).resolve().parent

# ─── Helper: run subprocess ───────────────────────────────────

def run(cmd: list[str], desc: str = "", timeout: int = 300) -> subprocess.CompletedProcess:
    """Run a command and print progress."""
    print(f"  ⏳ {desc}...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        print(f"  ❌ {desc} failed:")
        print(f"     {result.stderr[:1000]}")
        sys.exit(1)
    print(f"  ✅ {desc}")
    return result


# ─── Step 1: Download audio ───────────────────────────────────

def download_audio(url: str, output_path: Path, title: str = "") -> dict:
    """Download audio from a YouTube URL and return metadata."""
    print(f"\n  📥 Downloading audio from: {url}")

    # Create temp directory for this track
    temp_dir = Path(tempfile.mkdtemp())
    output_template = str(temp_dir / "%(title)s.%(ext)s")

    # Get predicted filename
    pred = subprocess.run(
        ["yt-dlp", "--print", "filename", "-o", output_template, "--no-playlist", url],
        capture_output=True, text=True, timeout=30
    )
    predicted_path = Path(pred.stdout.strip().split("\n")[-1]) if pred.returncode == 0 else None

    # Get video info
    info_result = subprocess.run(
        ["yt-dlp", "--dump-json", "--no-playlist", url],
        capture_output=True, text=True, timeout=60
    )
    info = json.loads(info_result.stdout.strip().split("\n")[0])
    video_title = title or info.get("title", "Untitled")
    duration = info.get("duration", 0)

    # Download audio
    run(
        ["yt-dlp", "-x", "--audio-format", "mp3", "--audio-quality", "0",
         "--output", output_template, "--no-playlist", url],
        desc=f"Downloading audio for \"{video_title}\"",
        timeout=300
    )

    # Find the downloaded file
    audio_file = None
    if predicted_path and predicted_path.exists():
        audio_file = predicted_path
    else:
        files = sorted(temp_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)
        if files:
            audio_file = files[0]

    if not audio_file or not audio_file.exists():
        print(f"  ❌ Could not find downloaded audio file")
        sys.exit(1)

    # Copy to output directory with a clean name
    track_id = f"track-{len(list(OUTPUT_DIR.glob('track-*')))}"
    dest_path = output_path / f"{track_id}.mp3"
    shutil.copy2(audio_file, dest_path)

    # Cleanup temp
    shutil.rmtree(temp_dir, ignore_errors=True)

    file_size_mb = dest_path.stat().st_size / 1024 / 1024
    print(f"  ✅ Audio saved: {dest_path.name} ({file_size_mb:.1f} MB)")

    return {
        "id": track_id,
        "title": video_title,
        "duration": duration,
        "file": dest_path,
    }


# ─── Step 2: Build track config ────────────────────────────────

def build_track_config(tracks: list[dict], output_path: Path) -> str:
    """Build a JSON config file for Remotion tracks."""
    config = []
    for track in tracks:
        duration_frames = int(track["duration"] * 30)  # 30fps
        config.append({
            "id": track["id"],
            "title": track["title"],
            "durationInFrames": duration_frames,
            "audioFile": f"{track['id']}.mp3",
        })

    config_path = output_path / "track-config.json"
    with open(config_path, "w") as f:
        json.dump({"tracks": config}, f, indent=2)

    print(f"\n  📝 Track config saved: {config_path.name}")
    for t in config:
        mins = t['durationInFrames'] // 30 // 60
        secs = t['durationInFrames'] // 30 % 60
        print(f"     {t['id']}: \"{t['title']}\" ({mins}:{secs:02d})")

    return str(config_path)


# ─── Step 3: Copy to Remotion public/ ─────────────────────────

def copy_to_remotion(tracks: list[dict]) -> None:
    """Copy audio files to Remotion's public directory."""
    print("\n  📂 Copying audio files to Remotion public/...")
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    for track in tracks:
        dest = PUBLIC_DIR / f"{track['id']}.mp3"
        shutil.copy2(track["file"], dest)
        print(f"     {track['id']}.mp3 → public/")

    print(f"  ✅ Audio files ready for Remotion")


# ─── Step 4: Render with Remotion CLI ─────────────────────────

def render_video(config_path: str, output_path: Path) -> Path:
    """Call Remotion CLI to render the final video with live output."""
    print("\n  🎬 Rendering video with Remotion...")
    print("     (Showing live progress below)\n")

    video_output = output_path / "video.mp4"

    # Use Popen to stream output live so user sees progress
    with subprocess.Popen(
        [
            "npx", "remotion", "render",
            "src/index.ts",
            "MashupVideo",
            str(video_output),
            "--props", config_path,
            "--codec=h264",
            "--crf=18",
        ],
        cwd=str(VIDEO_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    ) as proc:
        for line in proc.stdout:
            print(f"  {line.rstrip()}")

    if proc.returncode != 0:
        print(f"\n  ❌ Remotion render failed with exit code {proc.returncode}")
        sys.exit(1)

    print(f"\n  ✅ Video rendered!")
    print(f"     📁 {video_output}")
    print(f"     📏 {video_output.stat().st_size / 1024 / 1024:.1f} MB")

    return video_output


# ═══════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Create a YouTube audio mashup video with Remotion",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 scripts/create_mashup.py \\
      https://youtu.be/dQw4w9WgXcQ \\
      https://youtu.be/jNQXAC9IVRw

  python3 scripts/create_mashup.py \\
      https://youtu.be/dQw4w9WgXcQ --title1 \"Never Gonna Give You Up\" \\
      https://youtu.be/jNQXAC9IVRw --title2 \"Me at the zoo\"
        """,
    )
    parser.add_argument("urls", nargs="+", help="YouTube URLs (at least 2)")
    parser.add_argument("--title1", help="Custom title for first track")
    parser.add_argument("--title2", help="Custom title for second track")
    parser.add_argument("--title3", help="Custom title for third track")
    parser.add_argument("--title4", help="Custom title for fourth track")
    parser.add_argument("--title5", help="Custom title for fifth track")

    args = parser.parse_args()

    if len(args.urls) < 2:
        print("❌ Please provide at least 2 YouTube URLs")
        sys.exit(1)

    custom_titles = [getattr(args, f"title{i}", None) for i in range(1, 6)]

    print("=" * 60)
    print("  🎵 YouTube Audio Mashup Creator")
    print("=" * 60)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Download audio from each URL
    print("\n📥 Step 1: Downloading audio tracks...")
    tracks = []
    for i, url in enumerate(args.urls):
        title = custom_titles[i] if i < len(custom_titles) else ""
        track_info = download_audio(url, OUTPUT_DIR, title)
        tracks.append(track_info)

    # Step 2: Build track config
    print("\n📝 Step 2: Building Remotion track configuration...")
    config_path = build_track_config(tracks, OUTPUT_DIR)

    # Step 3: Copy to Remotion public directory
    print("\n📂 Step 3: Preparing Remotion assets...")
    copy_to_remotion(tracks)

    # Step 4: Render
    print("\n🎬 Step 4: Rendering final video...")
    video_path = render_video(config_path, OUTPUT_DIR)

    print()
    print("=" * 60)
    print("  ✅ Mashup Complete!")
    print(f"     📁 Video: {video_path}")
    print(f"     🎵 Tracks: {len(tracks)} songs")
    print("=" * 60)


if __name__ == "__main__":
    main()
