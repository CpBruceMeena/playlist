#!/usr/bin/env python3
"""
Seed the singers table with curated popular artists across 5 genres.
Idempotent — only inserts singers that don't already exist (matched by name).

Usage:
    python3 scripts/seed_singers.py
    DATABASE_URL="postgres://user:pass@localhost:5432/playlist" python3 scripts/seed_singers.py

Requirements:
    psycopg2-binary>=2.9
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("psycopg2 not installed. Install it with:")
    print("  pip install psycopg2-binary")
    sys.exit(1)


# ─── Singer Data ──────────────────────────────────────────────────────────────
SINGERS = [
    # ─── Punjabi ────────────────────────────────────────────────────────
    {"name": "Diljit Dosanjh", "genre": "punjabi", "description": "Punjabi singer, songwriter, and actor", "youtube_channel_id": "UCdQ3fZU5OWOl0sOEh6w7zAQ", "popularity_score": 99},
    {"name": "AP Dhillon", "genre": "punjabi", "description": "Punjabi singer, rapper, and record producer", "youtube_channel_id": "UCGLeD6r4LajJq0BvR8OqEAg", "popularity_score": 98},
    {"name": "Sidhu Moose Wala", "genre": "punjabi", "description": "Punjabi singer, rapper, and songwriter", "popularity_score": 97},
    {"name": "Karan Aujla", "genre": "punjabi", "description": "Punjabi singer, rapper, and songwriter", "popularity_score": 96},
    {"name": "Shubh", "genre": "punjabi", "description": "Punjabi singer, global sensation with hip-hop infused sound", "popularity_score": 95},
    {"name": "Arjan Dhillon", "genre": "punjabi", "description": "Punjabi singer and versatile songwriter, known for lyrical depth", "popularity_score": 93},
    {"name": "Gurdas Maan", "genre": "punjabi", "description": "Legendary Punjabi folk and pop singer", "popularity_score": 90},
    {"name": "Guru Randhawa", "genre": "punjabi", "description": "Punjabi pop singer", "popularity_score": 88},
    {"name": "Sharry Mann", "genre": "punjabi", "description": "Punjabi singer and actor", "popularity_score": 85},
    {"name": "Ammy Virk", "genre": "punjabi", "description": "Punjabi singer and actor", "popularity_score": 84},
    {"name": "Nimrat Khaira", "genre": "punjabi", "description": "Punjabi female singer", "popularity_score": 82},
    {"name": "Amrit Maan", "genre": "punjabi", "description": "Punjabi singer and songwriter", "popularity_score": 79},
    {"name": "Jasmine Sandlas", "genre": "punjabi", "description": "Punjabi singer and songwriter", "popularity_score": 78},
    {"name": "Garry Sandhu", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 77},
    {"name": "Satinder Sartaaj", "genre": "punjabi", "description": "Punjabi singer, poet, and songwriter", "popularity_score": 76},
    {"name": "Karan Randhawa", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 75},
    {"name": "Mankirt Aujla", "genre": "punjabi", "description": "Punjabi singer, known for chart-topping hits", "popularity_score": 74},
    {"name": "Prem Dhillon", "genre": "punjabi", "description": "Punjabi singer with street-style narrative", "popularity_score": 73},
    {"name": "Gurlej Akhtar", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 72},
    {"name": "Ranjit Bawa", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 71},
    {"name": "Tarsem Jassar", "genre": "punjabi", "description": "Punjabi singer and actor", "popularity_score": 70},
    {"name": "Fateh", "genre": "punjabi", "description": "Punjabi rapper", "popularity_score": 69},
    {"name": "Parmish Verma", "genre": "punjabi", "description": "Punjabi singer, rapper, and director", "popularity_score": 68},
    {"name": "Mickey Singh", "genre": "punjabi", "description": "Punjabi-American singer", "popularity_score": 67},
    {"name": "Sunanda Sharma", "genre": "punjabi", "description": "Punjabi female singer", "popularity_score": 65},
    {"name": "Cheema Y", "genre": "punjabi", "description": "Punjabi rapper, breakout star with distinct style", "popularity_score": 87},
    {"name": "Navaan Sandhu", "genre": "punjabi", "description": "Punjabi singer and rapper, rising star in pop-rap", "popularity_score": 82},
    {"name": "Kirat Gill", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 80},
    {"name": "Harmanjeet Singh", "genre": "punjabi", "description": "Punjabi folk singer", "popularity_score": 60},
    {"name": "Gurlez Akhtar", "genre": "punjabi", "description": "Punjabi singer, known for powerful vocals", "popularity_score": 63},

    # ─── Haryanvi ──────────────────────────────────────────────────────
    {"name": "Sachin Chaudhary", "genre": "haryanvi", "description": "Haryanvi singer known for folk and pop songs", "popularity_score": 88},
    {"name": "Masoom Sharma", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 87},
    {"name": "Amit Saini Rohtakiya", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 86},
    {"name": "Desi King (Fazilpuria)", "genre": "haryanvi", "description": "Haryanvi and Punjabi singer", "popularity_score": 85},
    {"name": "R Maan", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 82},
    {"name": "Khasa Aala Chahar", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 80},
    {"name": "Sumit Goswami", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 78},
    {"name": "Naveen Chaudhary", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 76},
    {"name": "Bintu Pabra", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 75},
    {"name": "Mandeep Choudhary", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 74},
    {"name": "Sahil Sandhu", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 72},
    {"name": "Rajoo Rathi", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 70},
    {"name": "Rohit Sardhana", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 68},
    {"name": "Gulab Sidhu", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 66},
    {"name": "Twinkle Arora", "genre": "haryanvi", "description": "Haryanvi female singer", "popularity_score": 65},
    {"name": "Sunny Sharma", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 64},
    {"name": "Sonu Kadiyan", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 63},
    {"name": "Akanksha Sharma", "genre": "haryanvi", "description": "Haryanvi female singer", "popularity_score": 62},
    {"name": "Monu Ghanghas", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 61},
    {"name": "Manoj Kanaujiya", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 60},
    {"name": "Dhanda Nyoliwala", "genre": "haryanvi", "description": "Haryanvi rapper with urban-inflected style, topping YouTube charts", "popularity_score": 90},
    {"name": "Raj Mawar", "genre": "haryanvi", "description": "Haryanvi singer, consistent hitmaker in high-energy dance tracks", "popularity_score": 84},
    {"name": "Vikram Sarkar", "genre": "haryanvi", "description": "Haryanvi singer, rising presence on trending playlists", "popularity_score": 80},
    {"name": "Renuka Panwar", "genre": "haryanvi", "description": "Haryanvi female singer, primary female vocal force in industry", "popularity_score": 82},
    {"name": "Krishan Chauhan", "genre": "haryanvi", "description": "Haryanvi singer, known for traditional-modern fusion", "popularity_score": 77},
    {"name": "Banjaare (Sumit & Anuj)", "genre": "haryanvi", "description": "Haryanvi duo, reached Billboard India with 'Bairan'", "popularity_score": 79},
    {"name": "Anil Prem Nagariya", "genre": "haryanvi", "description": "Haryanvi singer, consistent hits in YouTube jukeboxes", "popularity_score": 74},
    {"name": "Sapna Choudhary", "genre": "haryanvi", "description": "Popular Haryanvi dancer, singer, and entertainer", "popularity_score": 89},
    {"name": "Ajay Hooda", "genre": "haryanvi", "description": "Haryanvi lyricist, singer, and performer from Rohtak", "popularity_score": 83},
    {"name": "Diler Kharkiya", "genre": "haryanvi", "description": "Haryanvi singer known for highly popular hit songs", "popularity_score": 81},
    {"name": "Gulzaar Chhaniwala", "genre": "haryanvi", "description": "Haryanvi youth icon known for distinct rap style", "popularity_score": 79},
    {"name": "Pranjal Dahiya", "genre": "haryanvi", "description": "Haryanvi actress, model, and dancer in music videos", "popularity_score": 76},
    {"name": "Vikram Singh", "genre": "haryanvi", "description": "Haryanvi singer and performer", "popularity_score": 73},
    {"name": "MC Square", "genre": "haryanvi", "description": "Haryanvi rapper who brought regional music to national platforms", "popularity_score": 71},

    # ─── Hindi (Modern) ────────────────────────────────────────────────
    {"name": "Arijit Singh", "genre": "hindi", "description": "Indian playback singer, most popular of modern era", "popularity_score": 100, "youtube_channel_id": "UCKzQExt9Mildif3MZbAG5mg"},
    {"name": "Shreya Ghoshal", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 94},
    {"name": "Neha Kakkar", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 95},
    {"name": "Badshah", "genre": "hindi", "description": "Indian rapper and singer", "popularity_score": 93},
    {"name": "Atif Aslam", "genre": "hindi", "description": "Pakistani playback singer popular in Bollywood", "popularity_score": 92},
    {"name": "Sonu Nigam", "genre": "hindi", "description": "Indian playback singer, versatile vocalist", "popularity_score": 90},
    {"name": "Sunidhi Chauhan", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 89},
    {"name": "Darshan Raval", "genre": "hindi", "description": "Indian singer and songwriter", "popularity_score": 87},
    {"name": "Jubin Nautiyal", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 86},
    {"name": "Alka Yagnik", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 86},
    {"name": "Shankar Mahadevan", "genre": "hindi", "description": "Indian playback singer and composer", "popularity_score": 85},
    {"name": "Kumar Sanu", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 84},
    {"name": "Udit Narayan", "genre": "hindi", "description": "Nepalese-Indian playback singer", "popularity_score": 83},
    {"name": "Vishal Dadlani", "genre": "hindi", "description": "Indian singer and composer", "popularity_score": 82},
    {"name": "B Praak", "genre": "hindi", "description": "Indian singer and music director", "popularity_score": 81},
    {"name": "Mohit Chauhan", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Sachet Tandon", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 79},
    {"name": "Divya Kumar", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 78},
    {"name": "Vishal Mishra", "genre": "hindi", "description": "Indian singer and composer", "popularity_score": 77},
    {"name": "Papon (Angaraag Mahanta)", "genre": "hindi", "description": "Indian folk and playback singer", "popularity_score": 76},
    {"name": "Amit Trivedi", "genre": "hindi", "description": "Indian music composer and singer", "popularity_score": 75},
    {"name": "Tulsi Kumar", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 74},
    {"name": "Monali Thakur", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 73},
    {"name": "Harshdeep Kaur", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 72},
    {"name": "Neeti Mohan", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 70},
    {"name": "KK", "genre": "hindi", "description": "Indian playback singer, known for soulful romantic vocals", "popularity_score": 91},
    {"name": "Amitabh Bhattacharya", "genre": "hindi", "description": "Indian lyricist and singer", "popularity_score": 68},
    {"name": "Diljit Dosanjh", "genre": "hindi", "description": "Punjabi singer also popular in Bollywood", "popularity_score": 89},
    {"name": "Palak Muchhal", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 71},
    {"name": "Shilpa Rao", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 79},
    {"name": "Ananya Birla", "genre": "hindi", "description": "Indian singer and songwriter", "popularity_score": 63},
    {"name": "Raghav Chaitanya", "genre": "hindi", "description": "Indian playback singer, known for soft vocals", "popularity_score": 69},
    {"name": "Armaan Malik", "genre": "hindi", "description": "Indian playback singer and composer", "popularity_score": 84},
    {"name": "Raftaar", "genre": "hindi", "description": "Indian rapper and singer", "popularity_score": 80},
    {"name": "Dino James", "genre": "hindi", "description": "Indian rapper and singer", "popularity_score": 72},
    {"name": "King", "genre": "hindi", "description": "Indian singer and rapper, known for 'Tu Aake Dekhle'", "popularity_score": 83},
    {"name": "Mellow D", "genre": "hindi", "description": "Indian singer", "popularity_score": 66},

    # ─── Old Hindi ──────────────────────────────────────────────────────
    {"name": "Kishore Kumar", "genre": "old-hindi", "description": "Legendary Indian playback singer and actor", "popularity_score": 100},
    {"name": "Lata Mangeshkar", "genre": "old-hindi", "description": "Legendary Indian playback singer, Nightingale of India", "popularity_score": 100},
    {"name": "Mohammed Rafi", "genre": "old-hindi", "description": "Legendary Indian playback singer", "popularity_score": 98},
    {"name": "Asha Bhosle", "genre": "old-hindi", "description": "Legendary Indian playback singer", "popularity_score": 96},
    {"name": "Mukesh", "genre": "old-hindi", "description": "Legendary Indian playback singer", "popularity_score": 95},
    {"name": "Manna Dey", "genre": "old-hindi", "description": "Indian playback singer", "popularity_score": 90},
    {"name": "Geeta Dutt", "genre": "old-hindi", "description": "Indian playback singer", "popularity_score": 88},
    {"name": "Hemant Kumar", "genre": "old-hindi", "description": "Indian playback singer and composer", "popularity_score": 86},
    {"name": "Talat Mahmood", "genre": "old-hindi", "description": "Indian playback singer", "popularity_score": 85},
    {"name": "Noor Jehan", "genre": "old-hindi", "description": "Indian-Pakistani playback singer", "popularity_score": 84},
    {"name": "Suman Kalyanpur", "genre": "old-hindi", "description": "Indian playback singer", "popularity_score": 82},
    {"name": "Shamshad Begum", "genre": "old-hindi", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Rafi & Lata (Duets)", "genre": "old-hindi", "description": "Iconic duo of Indian playback singing", "popularity_score": 78},
    {"name": "K L Saigal", "genre": "old-hindi", "description": "Pioneering Indian playback singer and actor", "popularity_score": 75},
    {"name": "C H Atma", "genre": "old-hindi", "description": "Indian playback singer", "popularity_score": 70},

    # ─── English ────────────────────────────────────────────────────────
    {"name": "Taylor Swift", "genre": "english", "description": "American singer-songwriter, pop icon", "popularity_score": 99, "youtube_channel_id": "UCqECaJ8GagnnVelICmhV2gA"},
    {"name": "Ed Sheeran", "genre": "english", "description": "English singer-songwriter", "popularity_score": 98, "youtube_channel_id": "UC0C-w0YjGpqDXGB8IHb662A"},
    {"name": "Drake", "genre": "english", "description": "Canadian rapper and singer", "popularity_score": 97, "youtube_channel_id": "UCByuG6Gx8BTxg_lW7g5kX1A"},
    {"name": "The Weeknd", "genre": "english", "description": "Canadian singer, songwriter, and record producer", "popularity_score": 96},
    {"name": "Billie Eilish", "genre": "english", "description": "American singer-songwriter", "popularity_score": 95, "youtube_channel_id": "UCiGm_Eg9mS2IBVmHqbNi5TQ"},
    {"name": "Adele", "genre": "english", "description": "English singer-songwriter", "popularity_score": 94, "youtube_channel_id": "UCuV38a2LaLBM_HNQStM8QZg"},
    {"name": "Bruno Mars", "genre": "english", "description": "American singer, songwriter, and record producer", "popularity_score": 93, "youtube_channel_id": "UCkLDZSp0CmNdLC00Jh6aTXw"},
    {"name": "Rihanna", "genre": "english", "description": "Barbadian singer and businesswoman", "popularity_score": 93, "youtube_channel_id": "UCcgVECVN4OkpYHnh4S4FhHg"},
    {"name": "Dua Lipa", "genre": "english", "description": "English singer and songwriter", "popularity_score": 92, "youtube_channel_id": "UCJYwBcPFCf52h6D8XOIj0Dg"},
    {"name": "Ariana Grande", "genre": "english", "description": "American singer and actress", "popularity_score": 91, "youtube_channel_id": "UC9CoOnJkqdeHdLfH2p-Hw7g"},
    {"name": "Eminem", "genre": "english", "description": "American rapper and songwriter", "popularity_score": 91, "youtube_channel_id": "UCfM3M0-2PMdE3Wv3lF8zT1w"},
    {"name": "Coldplay", "genre": "english", "description": "British rock band", "popularity_score": 90, "youtube_channel_id": "UCC7DtnEIf6DYsCaJ4SiTlYg"},
    {"name": "Kendrick Lamar", "genre": "english", "description": "American rapper and songwriter", "popularity_score": 89},
    {"name": "Kanye West", "genre": "english", "description": "American rapper, singer, and record producer", "popularity_score": 88},
    {"name": "Post Malone", "genre": "english", "description": "American rapper and singer", "popularity_score": 87},
    {"name": "Imagine Dragons", "genre": "english", "description": "American pop rock band", "popularity_score": 87, "youtube_channel_id": "UCT9zcQNlyht7fRlcjmflRSA"},
    {"name": "Harry Styles", "genre": "english", "description": "English singer and actor", "popularity_score": 86},
    {"name": "Olivia Rodrigo", "genre": "english", "description": "American singer-songwriter", "popularity_score": 85},
    {"name": "Maroon 5", "genre": "english", "description": "American pop rock band", "popularity_score": 85},
    {"name": "Doja Cat", "genre": "english", "description": "American rapper and singer", "popularity_score": 84},
    {"name": "Travis Scott", "genre": "english", "description": "American rapper and record producer", "popularity_score": 83},
    {"name": "OneRepublic", "genre": "english", "description": "American pop rock band", "popularity_score": 82},
    {"name": "SZA", "genre": "english", "description": "American singer-songwriter", "popularity_score": 82},
    {"name": "Lana Del Rey", "genre": "english", "description": "American singer-songwriter", "popularity_score": 80},
    {"name": "Hozier", "genre": "english", "description": "Irish singer-songwriter", "popularity_score": 78},
]


def get_database_url() -> str:
    """Get the database URL from environment or prompt."""
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    # Default development URL
    return "host=localhost user=postgres password=password dbname=playlist port=5432 sslmode=disable"


def parse_dsn(dsn: str) -> dict:
    """Parse a libpq-style connection string or URI into psycopg2 kwargs."""
    # Handle URI format: postgres://user:pass@host:port/dbname
    if dsn.startswith("postgres://") or dsn.startswith("postgresql://"):
        parsed = urlparse(dsn)
        params = {
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 5432,
            "dbname": parsed.path.lstrip("/") if parsed.path else "playlist",
            "user": parsed.username or "postgres",
            "password": parsed.password or "",
        }
        if parsed.query:
            for k, v in [q.split("=", 1) for q in parsed.query.split("&")]:
                params[k] = v
        return params

    # Handle key=value format: host=localhost user=postgres ...
    params = {}
    for part in dsn.split():
        if "=" in part:
            key, value = part.split("=", 1)
            params[key.strip()] = value.strip()
    return params


def seed_singers(conn):
    """Insert singers that don't already exist in the database."""
    cur = conn.cursor()

    # Get existing names
    cur.execute("SELECT name FROM singers")
    existing = {row[0] for row in cur.fetchall()}
    print(f"Existing singers in DB: {len(existing)}")

    # Filter to new singers
    to_insert = [s for s in SINGERS if s["name"] not in existing]
    if not to_insert:
        print("No new singers to add. All singers already in database.")
        return

    # Batch insert
    now = datetime.now(timezone.utc)
    values = []
    for s in to_insert:
        sid = str(uuid.uuid4())
        values.append((
            sid, s["name"], s["genre"],
            s.get("description", ""),
            s.get("youtube_channel_id", ""),
            s["popularity_score"],
            True,  # is_active
            now, now,  # created_at, updated_at
        ))

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO singers (id, name, genre, description, youtube_channel_id,
                             popularity_score, is_active, created_at, updated_at)
        VALUES %s
        """,
        values,
        template="(%s, %s, %s, %s, %s, %s, %s, %s, %s)",
    )
    conn.commit()

    print(f"✅ Added {len(to_insert)} new singer(s):")
    for s in to_insert:
        print(f"   - {s['name']} ({s['genre']}, score: {s['popularity_score']})")


def main():
    dsn = get_database_url()
    params = parse_dsn(dsn)

    print(f"Connecting to database...")
    conn = psycopg2.connect(**params)
    conn.autocommit = False

    try:
        seed_singers(conn)
    finally:
        conn.close()

    # Verify
    print("\nDone! Singers seeded successfully.")


if __name__ == "__main__":
    main()
