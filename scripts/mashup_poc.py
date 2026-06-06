#!/usr/bin/env python3
"""
YouTube Audio Mashup — Enhanced PoC with Beautiful Video Background

Creates a video mashup from 2+ YouTube URLs with:
  - Per-track frames showing the full playlist with the current track highlighted
  - Gradient backgrounds, glassmorphism panels, progress bars
  - Album art placeholders and decorative visual elements

Usage:
    python3 scripts/mashup_poc.py <url1> <url2> [options]

Dependencies:
    - yt-dlp (brew install yt-dlp)
    - ffmpeg (brew install ffmpeg)
    - Pillow (in .venv)

Output:
    ./output/mashup-poc/
        ├── merged-audio.mp3
        ├── frame-0.png, frame-1.png, ...
        ├── seg-0.mp4, seg-1.mp4, ...
        └── mashup-video.mp4
"""

import argparse
import json

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "output" / "mashup-poc"


# ═══════════════════════════════════════════════════════════════
#  Design Tokens
# ═══════════════════════════════════════════════════════════════

# Color values — Pillow accepts (R,G,B) tuples for opaque and (R,G,B,A) tuples for alpha.
# We use a simple format: "#RRGGBB" for opaque, "#RRGGBB_AA" for alpha where AA is 0-255.

def parse_color(c: str) -> tuple:
    """Parse "#RRGGBB" or "#RRGGBB_AA" into an (R,G,B) or (R,G,B,A) tuple.
    AA is hex-encoded alpha (00-FF)."""
    h = c.lstrip("#")
    if "_" in h:
        parts = h.split("_")
        rgb = tuple(int(parts[0][i:i+2], 16) for i in (0, 2, 4))
        return rgb + (int(parts[1], 16),)  # alpha is also hex
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


COLORS = {
    "bg_top": parse_color("#0f0c29"),
    "bg_mid": parse_color("#302b63"),
    "bg_bot": parse_color("#24243e"),
    "accent": parse_color("#e94560"),
    "accent_glow": parse_color("#ff6b81"),
    "text_primary": parse_color("#ffffff"),
    "text_secondary": parse_color("#ffffff_7f"),       # 0.5 alpha
    "text_muted": parse_color("#ffffff_40"),           # 0.25 alpha
    "panel_bg": parse_color("#ffffff_0f"),             # 0.06 alpha
    "panel_border": parse_color("#ffffff_1a"),         # 0.1 alpha
    "highlight_bg": parse_color("#e94560_26"),         # 0.15 alpha
    "highlight_border": parse_color("#e94560_66"),     # 0.4 alpha
    "progress_bg": parse_color("#ffffff_1a"),          # 0.1 alpha
    "progress_fill": parse_color("#e94560"),
    "now_playing_dot": parse_color("#4ade80"),
    "card_1": parse_color("#667eea"),
    "card_2": parse_color("#764ba2"),
}

WIDTH, HEIGHT = 1920, 1080

# ═══════════════════════════════════════════════════════════════
#  Helpers
# ═══════════════════════════════════════════════════════════════

def run(cmd: list[str], desc: str = "", timeout: int = 300):
    print(f"  {desc}...", end=" ", flush=True)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        print(f"❌ FAILED")
        print(f"     {result.stderr[:500]}")
        sys.exit(1)
    print("✅")
    return result


def load_font(size: int):
    """Load a system font at the given size."""
    for fp in [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
    ]:
        if Path(fp).exists():
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                continue
    return ImageFont.load_default()





# ═══════════════════════════════════════════════════════════════
#  Drawing Primitives
# ═══════════════════════════════════════════════════════════════

# Color helper: rgba string like "rgba(255,255,255,0.5)" → tuple (255, 255, 255, 128)
def rgba(s: str) -> tuple:
    s = s.replace("rgba(", "").replace(")", "")
    parts = [p.strip() for p in s.split(",")]
    r, g, b, a = int(parts[0]), int(parts[1]), int(parts[2]), float(parts[3])
    return (r, g, b, int(a * 255))


def draw_gradient(draw: ImageDraw, w: int, h: int):
    """Draw a vertical gradient background."""
    top = COLORS["bg_top"]
    mid = COLORS["bg_mid"]
    bot = COLORS["bg_bot"]

    for y in range(h):
        t = y / h
        if t < 0.5:
            blend = t * 2
            r = int(top[0] + (mid[0] - top[0]) * blend)
            g = int(top[1] + (mid[1] - top[1]) * blend)
            b = int(top[2] + (mid[2] - top[2]) * blend)
        else:
            blend = (t - 0.5) * 2
            r = int(mid[0] + (bot[0] - mid[0]) * blend)
            g = int(mid[1] + (bot[1] - mid[1]) * blend)
            b = int(mid[2] + (bot[2] - mid[2]) * blend)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def draw_decorative_circles(draw: ImageDraw, w: int, h: int):
    """Draw subtle decorative circles for visual flair."""
    subtle = rgba("rgba(255,255,255,0.02)")
    # Large subtle circle top-right
    draw.ellipse(
        [w - 300, -150, w + 100, 250],
        fill=None, outline=subtle, width=1
    )
    # Small circle bottom-left
    draw.ellipse(
        [-100, h - 200, 150, h + 50],
        fill=None, outline=subtle, width=1
    )


def draw_rounded_rect(draw: ImageDraw, xy: tuple, radius: int, fill=None,
                      outline=None, width: int = 1):
    """Draw a rounded rectangle."""
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


# ═══════════════════════════════════════════════════════════════
#  Frame Generation
# ═══════════════════════════════════════════════════════════════

def generate_frame(tracks: list[dict], current_index: int, output_path: Path,
                   progress: float = 0):
    """Generate a single frame image for the given track index.

    Layout:
    ┌──────────────────────────────────────────────────┐
    │  🔴 Now Playing                      Track X/Y  │  <- Top bar
    ├──────────────────────────────────────────────────┤
    │  ┌──────────┐                                    │
    │  │  Album   │   Track Title                      │  <- Main content
    │  │  Art     │   Artist name                      │
    │  │   🎵     │   ● Now Playing                    │
    │  └──────────┘                                    │
    │                                                  │
    │  ── Playlist ────────────────────────────        │
    │  01  First Song Title           3:33  ▶          │  <- Playlist rows
    │  02  Second Song Title          4:12  ● NOW      │  <- Highlighted
    │  03  Third Song Title           2:45             │
    │                                                  │
    │  ▓▓▓▓▓▓░░░░░░░░░░░░░░  1:23 / 3:33              │  <- Progress bar
    └──────────────────────────────────────────────────┘
    """
    img = Image.new("RGB", (WIDTH, HEIGHT), (15, 12, 41))
    draw = ImageDraw.Draw(img)

    # ── Background ──
    draw_gradient(draw, WIDTH, HEIGHT)
    draw_decorative_circles(draw, WIDTH, HEIGHT)

    # Add a subtle radial glow behind the current track in the playlist
    glow_center_x = 960
    glow_center_y = 540
    for i in range(3):
        r = 300 + i * 100
        alpha = 8 - i * 2
        draw.ellipse(
            [glow_center_x - r, glow_center_y - r, glow_center_x + r, glow_center_y + r],
            fill=None,
            outline=(233, 69, 96, alpha),
            width=1,
        )

    # ── Top Bar ──
    # "Now Playing" label with green dot
    dot_r = 6
    dot_xy = (60, 45)
    draw.ellipse(
        [dot_xy[0] - dot_r, dot_xy[1] - dot_r, dot_xy[0] + dot_r, dot_xy[1] + dot_r],
        fill=COLORS["now_playing_dot"],
    )
    font_small = load_font(16)
    draw.text((dot_xy[0] + 18, dot_xy[1] - 9), "NOW PLAYING",
              fill=COLORS["text_secondary"], font=font_small)

    # Track counter top-right
    track_counter = f"Track {current_index + 1} of {len(tracks)}"
    counter_bbox = draw.textbbox((0, 0), track_counter, font=font_small)
    draw.text((WIDTH - 60 - (counter_bbox[2] - counter_bbox[0]), 36),
              track_counter, fill=COLORS["text_muted"], font=font_small)

    # Thin separator line under top bar
    draw.line([(60, 70), (WIDTH - 60, 70)], fill=(255, 255, 255, 12), width=1)

    # ── Album Art Placeholder ──
    art_size = 280
    art_x, art_y = 120, 130
    # Rounded square with gradient
    art_img = Image.new("RGB", (art_size, art_size), (0, 0, 0))
    art_draw = ImageDraw.Draw(art_img)
    c1 = COLORS["card_1"]
    c2 = COLORS["card_2"]
    for y in range(art_size):
        t = y / art_size
        r = int(c1[0] + (c2[0] - c1[0]) * t)
        g = int(c1[1] + (c2[1] - c1[1]) * t)
        b = int(c1[2] + (c2[2] - c1[2]) * t)
        art_draw.line([(0, y), (art_size, y)], fill=(r, g, b))
    # Music note icon in center of album art
    note_font = load_font(80)
    art_draw.text((art_size // 2 - 30, art_size // 2 - 40), "🎵",
                  fill=(255, 255, 255, 76), font=note_font)
    art_img = art_img.filter(ImageFilter.GaussianBlur(radius=1))
    img.paste(art_img, (art_x, art_y))

    # Album art border (glassmorphism)
    draw_rounded_rect(draw, (art_x, art_y, art_x + art_size, art_y + art_size),
                      radius=20, outline=COLORS["panel_border"], width=2)

    # ── Current Track Info ──
    current = tracks[current_index]
    track_num_font = load_font(14)
    draw.text((art_x + art_size + 40, art_y + 20),
              f"TRACK {current_index + 1:02d}",
              fill=COLORS["accent"], font=track_num_font)

    # Track title (large)
    title_font = load_font(48)
    title = current["title"]
    if len(title) > 30:
        title = title[:27] + "..."
    draw.text((art_x + art_size + 40, art_y + 50),
              title, fill=COLORS["text_primary"], font=title_font)

    # Duration
    mins = current["duration"] // 60
    secs = current["duration"] % 60
    dur_font = load_font(18)
    draw.text((art_x + art_size + 40, art_y + 115),
              f"{mins}:{secs:02d}",
              fill=COLORS["text_secondary"], font=dur_font)

    # "Now Playing" badge
    badge_y = art_y + 160
    draw_rounded_rect(draw,
                      (art_x + art_size + 40, badge_y,
                       art_x + art_size + 200, badge_y + 36),
                      radius=18, fill=COLORS["accent"])
    badge_font = load_font(13)
    draw.text((art_x + art_size + 60, badge_y + 9),
              "●  NOW PLAYING",
              fill=COLORS["text_primary"], font=badge_font)

    # ── Playlist Panel ──
    panel_x, panel_y = 120, 470
    panel_w = WIDTH - 240
    row_h = 64
    panel_h = len(tracks) * row_h + 60

    # Panel background
    draw_rounded_rect(draw,
                      (panel_x, panel_y, panel_x + panel_w, panel_y + panel_h),
                      radius=16, fill=COLORS["panel_bg"],
                      outline=COLORS["panel_border"], width=1)

    # "Playlist" header
    draw.text((panel_x + 30, panel_y + 18),
              "PLAYLIST", fill=COLORS["text_muted"], font=track_num_font)

    # Track rows
    row_font = load_font(22)
    for i, t in enumerate(tracks):
        ry = panel_y + 55 + i * row_h
        is_current = (i == current_index)

        # Row background for current track
        if is_current:
            draw_rounded_rect(draw,
                              (panel_x + 12, ry, panel_x + panel_w - 12, ry + row_h - 4),
                              radius=10,
                              fill=COLORS["highlight_bg"],
                              outline=COLORS["highlight_border"],
                              width=1)

        # Track number
        num_str = f"{i + 1:02d}"
        num_color = COLORS["accent"] if is_current else COLORS["text_muted"]
        draw.text((panel_x + 32, ry + 16), num_str,
                  fill=num_color, font=row_font)

        # Track title (truncated)
        title_str = t["title"][:40] + "..." if len(t["title"]) > 40 else t["title"]
        title_color = COLORS["text_primary"] if is_current else COLORS["text_secondary"]
        draw.text((panel_x + 80, ry + 16), title_str,
                  fill=title_color, font=row_font)

        # Duration
        mins = t["duration"] // 60
        secs = t["duration"] % 60
        dur_str = f"{mins}:{secs:02d}"
        dur_x = panel_x + panel_w - 100
        draw.text((dur_x, ry + 16), dur_str,
                  fill=COLORS["text_muted"], font=row_font)

        # Now Playing indicator for current track
        if is_current:
            indicator_font = load_font(14)
            draw.text((dur_x - 50, ry + 18),
                      "▶  NOW",
                      fill=COLORS["accent_glow"], font=indicator_font)

        # Separator line between rows
        if i < len(tracks) - 1:
            draw.line([(panel_x + 30, ry + row_h - 2),
                       (panel_x + panel_w - 30, ry + row_h - 2)],
                      fill=(255, 255, 255, 8), width=1)

    # ── Progress Bar ──
    bar_y = HEIGHT - 60
    bar_w = WIDTH - 240
    bar_x = 120
    bar_h = 4

    # Track background
    draw_rounded_rect(draw,
                      (bar_x, bar_y, bar_x + bar_w, bar_y + bar_h),
                      radius=2, fill=COLORS["progress_bg"])

    # Track fill
    fill_w = int(bar_w * progress)
    if fill_w > 0:
        draw_rounded_rect(draw,
                          (bar_x, bar_y, bar_x + fill_w, bar_y + bar_h),
                          radius=2, fill=COLORS["progress_fill"])

    # Time labels
    cur_mins = int(current["duration"] * progress) // 60
    cur_secs = int(current["duration"] * progress) % 60
    cur_time = f"{cur_mins}:{cur_secs:02d}"
    total_time = f"{current['duration'] // 60}:{current['duration'] % 60:02d}"

    time_font = load_font(13)
    draw.text((bar_x, bar_y + 12), cur_time,
              fill=COLORS["text_muted"], font=time_font)
    draw.text((bar_x + bar_w - 40, bar_y + 12), total_time,
              fill=COLORS["text_muted"], font=time_font)

    # ── Save ──
    img.save(output_path, "PNG", optimize=True)
    return output_path


# ═══════════════════════════════════════════════════════════════
#  Step 1: Download audio
# ═══════════════════════════════════════════════════════════════

def download_audio(url: str, output_dir: Path, track_num: int, custom_title: str = "") -> dict:
    """Download audio from a YouTube URL."""
    temp_dir = Path(tempfile.mkdtemp())
    template = str(temp_dir / "%(title)s.%(ext)s")

    info = json.loads(
        subprocess.run(
            ["yt-dlp", "--dump-json", "--no-playlist", url],
            capture_output=True, text=True, timeout=60
        ).stdout.strip().split("\n")[0]
    )
    title = custom_title or info.get("title", f"Track {track_num}")
    duration = info.get("duration", 0)

    pred = subprocess.run(
        ["yt-dlp", "--print", "filename", "-o", template, "--no-playlist", url],
        capture_output=True, text=True, timeout=30
    )
    predicted = Path(pred.stdout.strip().split("\n")[-1]) if pred.returncode == 0 else None

    run(
        ["yt-dlp", "-x", "--audio-format", "mp3", "--audio-quality", "0",
         "-o", template, "--no-playlist", url],
        desc=f"  Downloading track {track_num}: {title[:50]}",
        timeout=300
    )

    src = predicted if (predicted and predicted.exists()) else None
    if src is None:
        files = sorted(temp_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)
        src = files[0] if files else None

    if not src or not src.exists():
        print(f"  ❌ Could not find downloaded audio")
        sys.exit(1)

    dest = output_dir / f"track-{track_num}.mp3"
    shutil.copy2(src, dest)
    shutil.rmtree(temp_dir, ignore_errors=True)

    print(f"     Track {track_num}: {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB, {duration}s)")
    return {"title": title, "duration": duration, "file": dest, "id": f"track-{track_num}"}


# ═══════════════════════════════════════════════════════════════
#  Step 2: Concatenate audio
# ═══════════════════════════════════════════════════════════════

def concat_audio(tracks: list[dict], output_dir: Path) -> Path:
    """Concatenate audio files using FFmpeg concat demuxer."""
    merged = output_dir / "merged-audio.mp3"
    concat_file = output_dir / "concat.txt"

    with open(concat_file, "w") as f:
        for t in tracks:
            f.write(f"file '{t['file'].name}'\n")

    run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(concat_file), "-c", "copy", str(merged)],
        desc="  Concatenating audio tracks",
        timeout=120
    )

    total_dur = sum(t["duration"] for t in tracks)
    print(f"     Merged: {merged.name} ({merged.stat().st_size / 1024 / 1024:.1f} MB, {total_dur}s)")
    return merged


# ═══════════════════════════════════════════════════════════════
#  Step 3: Generate video segments per track
# ═══════════════════════════════════════════════════════════════

def create_video_segments(tracks: list[dict], output_dir: Path,
                          fps: int = 30) -> list[Path]:
    """Generate per-track video segments with beautiful frames.

    For each track, we generate a frame image showing the playlist
    with that track highlighted, then create a video segment by
    looping the frame for the track's duration.
    """
    segments = []

    for i, track in enumerate(tracks):
        print(f"\n  🎨 Creating frame for track {i + 1}: {track['title'][:40]}")

        # Generate frame with current track highlighted
        frame_path = output_dir / f"frame-{i}.png"
        # Generate a few intermediate progress frames for visual variety
        # We'll generate just the endpoint (progress=1) since it's a static frame
        generate_frame(tracks, i, frame_path, progress=0)

        # Create video segment from this frame
        seg_path = output_dir / f"seg-{i}.mp4"
        duration_secs = max(track["duration"], 1)

        run(
            ["ffmpeg", "-y",
             "-loop", "1",
             "-i", str(frame_path),
             "-c:v", "libx264", "-preset", "fast", "-crf", "20",
             "-pix_fmt", "yuv420p",
             "-t", str(duration_secs),
             str(seg_path)],
            desc=f"  Creating segment {i + 1}/{len(tracks)} ({duration_secs}s)",
            timeout=600
        )

        segments.append(seg_path)

    return segments


# ═══════════════════════════════════════════════════════════════
#  Step 4: Combine segments + audio
# ═══════════════════════════════════════════════════════════════

def combine_final(segments: list[Path], merged_audio: Path, output_dir: Path) -> Path:
    """Combine video segments with merged audio into final video."""
    video_path = output_dir / "mashup-video.mp4"

    # Create concat file for video segments
    concat_vid = output_dir / "concat_video.txt"
    with open(concat_vid, "w") as f:
        for seg in segments:
            f.write(f"file '{seg.name}'\n")

    # First concatenate all video segments
    temp_video = output_dir / "temp-joined.mp4"
    run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
         "-i", str(concat_vid), "-c", "copy", str(temp_video)],
        desc="  Joining video segments",
        timeout=120
    )

    # Then merge with audio
    run(
        ["ffmpeg", "-y",
         "-i", str(temp_video),
         "-i", str(merged_audio),
         "-c:v", "copy",
         "-c:a", "aac",
         "-map", "0:v:0",
         "-map", "1:a:0",
         "-shortest",
         str(video_path)],
        desc="  Merging video + audio",
        timeout=120
    )

    # Cleanup temp
    temp_video.unlink(missing_ok=True)

    return video_path


# ═══════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="YouTube Audio Mashup — Enhanced PoC with beautiful video backgrounds"
    )
    parser.add_argument("urls", nargs="+", help="YouTube URLs (at least 2)")
    parser.add_argument("--title1", help="Custom title for track 1")
    parser.add_argument("--title2", help="Custom title for track 2")
    parser.add_argument("--title3", help="Custom title for track 3")

    args = parser.parse_args()
    if len(args.urls) < 2:
        print("❌ Need at least 2 YouTube URLs")
        sys.exit(1)

    titles = [getattr(args, f"title{i}", "") or None for i in range(1, 6)]

    print("=" * 60)
    print("  🎵 YouTube Audio Mashup — Enhanced PoC")
    print("  Beautiful per-track frames with playlist UI")
    print("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Step 1: Download audio
    print("\n📥 Step 1: Downloading audio tracks...")
    tracks = []
    for i, url in enumerate(args.urls[:5]):
        ct = titles[i] if i < len(titles) else None
        info = download_audio(url, OUTPUT_DIR, i + 1, ct or "")
        tracks.append(info)

    # Step 2: Concatenate audio
    print("\n🔊 Step 2: Merging audio tracks...")
    merged = concat_audio(tracks, OUTPUT_DIR)

    # Step 3: Create video segments
    print("\n🎨 Step 3: Generating per-track video segments with enhanced frames...")
    segments = create_video_segments(tracks, OUTPUT_DIR)

    # Step 4: Combine everything
    print("\n🎬 Step 4: Combining segments with audio...")
    final = combine_final(segments, merged, OUTPUT_DIR)

    # Summary
    print()
    print("=" * 60)
    print("  ✅ Mashup Complete!")
    print(f"     📁 Final video:  {final}")
    print(f"     📏 Size:        {final.stat().st_size / 1024 / 1024:.1f} MB")
    print(f"     🎵 Tracks:      {len(tracks)} songs")
    for t in tracks:
        print(f"        {t['id']}: {t['title']} ({t['duration']}s)")
    print("=" * 60)


if __name__ == "__main__":
    main()
