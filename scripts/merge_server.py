"""
Merge Server — Python Flask service for merging YouTube videos into a single video file.

Usage:
    python3 scripts/merge_server.py

Runs on port 5002 by default. Set PORT env var to change.

The Go backend (port 3001) proxies merge requests to this server.
Merged files are stored in the 'merged/' directory and served via the Go backend.
"""

import os
import sys
import uuid
import json
import subprocess
import tempfile
import shutil
import re
import logging
from pathlib import Path
from datetime import datetime, timezone

try:
    from flask import Flask, request, jsonify, send_from_directory
except ImportError:
    print("Flask not installed. Run: pip3 install flask")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [merge] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Directory for merged output files
MERGED_DIR = Path(__file__).resolve().parent.parent / "merged"
MERGED_DIR.mkdir(exist_ok=True)

# Metadata directory (sidecar JSON files)
METADATA_DIR = MERGED_DIR / ".meta"
METADATA_DIR.mkdir(exist_ok=True)


def sanitize_filename(name: str) -> str:
    """Remove characters unsafe for filenames."""
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"\s+", "_", name)
    return name.strip(" _-")[:50] or "merged"


def download_video(youtube_id: str, output_template: str, timeout: int = 120) -> str | None:
    """
    Download a video from YouTube using yt-dlp.
    Returns the path to the downloaded file, or None on failure.
    """
    yt_url = f"https://www.youtube.com/watch?v={youtube_id}"
    cmd = [
        "yt-dlp",
        "-f", "best[height<=720]",
        "-o", output_template,
        "--no-playlist",
        "--quiet",
        "--no-warnings",
        yt_url,
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        logger.error(f"Timeout downloading video {youtube_id}")
        return None
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to download video {youtube_id}: {e.stderr.decode()[:200]}")
        return None

    # Find the downloaded file
    base = output_template.replace("%(ext)s", "*")
    matches = list(Path(base).parent.glob(Path(base).name))
    if not matches:
        logger.error(f"No output file found for video {youtube_id}")
        return None

    return str(matches[0])


def get_video_duration(filepath: str) -> float:
    """Get video duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", filepath],
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode == 0 and result.stdout.strip():
            return float(result.stdout.strip())
    except Exception as e:
        logger.warning(f"Could not get duration for {filepath}: {e}")
    return 0


@app.route("/api/merge", methods=["POST"])
def handle_merge():
    """Accept a list of YouTube video IDs, download and merge them into one video file."""
    data = request.get_json(silent=True)
    if not data or "videos" not in data:
        return jsonify({"error": {"message": "Missing 'videos' field", "code": "INVALID_REQUEST"}}), 400

    videos = data["videos"]
    if not isinstance(videos, list) or len(videos) < 2:
        return jsonify({"error": {"message": "At least 2 videos are required", "code": "INVALID_REQUEST"}}), 400

    merge_name = data.get("name", "").strip()
    job_id = uuid.uuid4().hex[:16]
    logger.info(f"[{job_id}] Starting merge of {len(videos)} videos - name: {merge_name or 'auto'}")

    # Create temp working directory
    work_dir = Path(tempfile.mkdtemp(prefix=f"merge_{job_id}_"))
    downloaded = []

    try:
        # Download each video
        # Use the first video's thumbnail as the merged result thumbnail
        first_thumbnail = videos[0].get("thumbnailUrl", "") if videos else ""

        for i, video in enumerate(videos):
            vid_id = video.get("id", "")
            vid_title = video.get("title", f"video_{i}")

            if not vid_id:
                logger.warning(f"[{job_id}] Skipping video {i}: no ID")
                continue

            output_template = str(work_dir / f"video_{i}.%(ext)s")
            video_path = download_video(vid_id, output_template)

            if video_path and os.path.exists(video_path):
                downloaded.append({"index": i, "id": vid_id, "title": vid_title, "path": video_path})
                logger.info(f"[{job_id}] Downloaded video {i}: {vid_id}")
            else:
                logger.warning(f"[{job_id}] Failed to download video {i}: {vid_id}")

        if len(downloaded) < 2:
            return jsonify({
                "error": {
                    "message": f"Could only download {len(downloaded)}/{len(videos)} videos. At least 2 are needed.",
                    "code": "MERGE_INSUFFICIENT_DOWNLOADS",
                }
            }), 500

        # Create ffmpeg concat file
        file_list = work_dir / "files.txt"
        with open(file_list, "w") as f:
            for item in downloaded:
                f.write(f"file '{item['path']}'\n")

        # Use provided name or auto-generate from first song
        display_title = merge_name if merge_name else (sanitize_filename(downloaded[0]["title"]).replace("_", " ") + " (Merged)")
        safe_name = sanitize_filename(merge_name) if merge_name else sanitize_filename(downloaded[0]["title"])
        output_filename = f"{safe_name}_{job_id[:8]}.mp4"
        output_path = MERGED_DIR / output_filename

        # Run ffmpeg to concatenate videos
        ffmpeg_cmd = [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", str(file_list),
            "-c", "copy",    # Copy without re-encoding (fast)
            "-y",            # Overwrite output
            str(output_path),
        ]

        logger.info(f"[{job_id}] Running ffmpeg merge (concat)...")
        result = subprocess.run(ffmpeg_cmd, check=True, capture_output=True, timeout=600)

        # Total duration
        total_duration = sum(get_video_duration(item["path"]) for item in downloaded)

        # Save metadata sidecar
        metadata = {
            "id": job_id,
            "filename": output_filename,
            "title": display_title,
            "thumbnailUrl": first_thumbnail,
            "songs": [{"id": item["id"], "title": item["title"]} for item in downloaded],
            "songCount": len(downloaded),
            "duration": int(total_duration),
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "videoUrl": f"/api/v1/merged/{output_filename}",
        }

        meta_path = METADATA_DIR / f"{job_id}.json"
        with open(meta_path, "w") as f:
            json.dump(metadata, f)

        logger.info(f"[{job_id}] Merge complete: {output_filename}")

        return jsonify({"data": metadata})

    except subprocess.TimeoutExpired:
        logger.error(f"[{job_id}] ffmpeg timed out")
        return jsonify({"error": {"message": "Merge timed out", "code": "MERGE_TIMEOUT"}}), 500
    except subprocess.CalledProcessError as e:
        stderr = e.stderr.decode()[:500]
        # If concat copy failed, try re-encoding
        if "codec" in stderr.lower() or "stream" in stderr.lower():
            logger.info(f"[{job_id}] Concat copy failed, retrying with re-encoding...")
            try:
                safe_name = sanitize_filename(merge_name) if merge_name else sanitize_filename(downloaded[0]["title"])
                output_filename = f"{safe_name}_{job_id[:8]}.mp4"
                output_path = MERGED_DIR / output_filename

                file_list = work_dir / "files.txt"
                with open(file_list, "w") as f:
                    for item in downloaded:
                        f.write(f"file '{item['path']}'\n")

                ffmpeg_cmd = [
                    "ffmpeg",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(file_list),
                    "-c:v", "libx264",
                    "-c:a", "aac",
                    "-preset", "fast",
                    "-y",
                    str(output_path),
                ]
                subprocess.run(ffmpeg_cmd, check=True, capture_output=True, timeout=600)

                total_duration = sum(get_video_duration(item["path"]) for item in downloaded)

                metadata = {
                    "id": job_id,
                    "filename": output_filename,
                    "title": display_title,
                    "songs": [{"id": item["id"], "title": item["title"]} for item in downloaded],
                    "songCount": len(downloaded),
                    "duration": int(total_duration),
                    "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    "videoUrl": f"/api/v1/merged/{output_filename}",
                }

                meta_path = METADATA_DIR / f"{job_id}.json"
                with open(meta_path, "w") as f:
                    json.dump(metadata, f)

                logger.info(f"[{job_id}] Merge complete (with re-encode): {output_filename}")
                return jsonify({"data": metadata})
            except subprocess.TimeoutExpired:
                logger.error(f"[{job_id}] ffmpeg re-encode timed out")
                return jsonify({"error": {"message": "Merge timed out", "code": "MERGE_TIMEOUT"}}), 500
            except subprocess.CalledProcessError as e2:
                logger.error(f"[{job_id}] ffmpeg re-encode failed: {e2.stderr.decode()[:500]}")
                return jsonify({"error": {"message": "Failed to merge videos", "code": "MERGE_FAILED"}}), 500

        logger.error(f"[{job_id}] ffmpeg failed: {stderr}")
        return jsonify({"error": {"message": "Failed to merge videos", "code": "MERGE_FAILED"}}), 500
    except Exception as e:
        logger.error(f"[{job_id}] Unexpected error: {e}")
        return jsonify({"error": {"message": "Internal server error", "code": "INTERNAL_ERROR"}}), 500
    finally:
        # Clean up temp work directory
        shutil.rmtree(work_dir, ignore_errors=True)


@app.route("/api/merged", methods=["GET"])
def list_merged():
    """List all merged videos with their metadata."""
    merged_list = []

    # Load metadata from sidecar files
    if METADATA_DIR.exists():
        for meta_file in sorted(METADATA_DIR.glob("*.json"), key=os.path.getmtime, reverse=True):
            try:
                with open(meta_file) as f:
                    metadata = json.load(f)
                    # Verify the actual file still exists
                    if (MERGED_DIR / metadata["filename"]).exists():
                        merged_list.append(metadata)
            except (json.JSONDecodeError, KeyError, OSError) as e:
                logger.warning(f"Error reading metadata file {meta_file}: {e}")

    return jsonify({"data": merged_list})


@app.route("/api/merged/<filename>")
def serve_merged(filename):
    """Serve merged video files for playback (not as attachment)."""
    # If filename is a path, extract just the filename
    safe_name = Path(filename).name
    return send_from_directory(str(MERGED_DIR), safe_name, as_attachment=False)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "merge-server"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5002"))
    logger.info(f"🚀 Merge server starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
