#!/usr/bin/env python3
"""
Seed the tv_series table with popular Indian TV serials across major channels.
Idempotent — only inserts series that don't already exist (matched by name).

Usage:
    python3 scripts/seed_tv_series.py
    DATABASE_URL="postgres://user:pass@localhost:5432/playlist" python3 scripts/seed_tv_series.py

Requirements:
    psycopg2-binary>=2.9
"""

import os
import sys
from collections import Counter
from datetime import datetime, timezone
from urllib.parse import urlparse

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("psycopg2 not installed. Install it with:")
    print("  pip install psycopg2-binary")
    sys.exit(1)


# ─── TV Series Data ──────────────────────────────────────────────────────────

TV_SERIES = [
    # ═══════════════════════════════════════════════════════════════════════════
    #  SAB TV
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Taarak Mehta Ka Ooltah Chashmah", "channel": "SAB TV", "genre": "comedy", "description": "Longest-running Indian sitcom about the lives of residents of Gokuldham Society", "popularity_score": 100},
    {"name": "Bhabiji Ghar Par Hain", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series about two neighboring couples with a friendly rivalry", "popularity_score": 96},
    {"name": "The Kapil Sharma Show", "channel": "SAB TV", "genre": "comedy", "description": "Popular Indian comedy talk show hosted by Kapil Sharma", "popularity_score": 98},
    {"name": "FIR", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series set in a police station with hilarious cases", "popularity_score": 90},
    {"name": "Lapataganj", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series set in a small town with quirky characters", "popularity_score": 85},
    {"name": "Chidiya Ghar", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series about a joint family living in a mansion", "popularity_score": 86},
    {"name": "Tenali Rama", "channel": "SAB TV", "genre": "comedy", "description": "Historical comedy-drama about the witty court poet Tenali Raman", "popularity_score": 84},
    {"name": "Jijaji Chhat Per Koii Hai", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series about a brother-in-law's quirky adventures", "popularity_score": 80},
    {"name": "Bhakharwadi", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series about a Gujarati family", "popularity_score": 78},
    {"name": "Gutur Gu", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series set in a village with unique characters", "popularity_score": 76},
    {"name": "Shrimaan Shrimati Phir Se", "channel": "SAB TV", "genre": "comedy", "description": "Comedy series about two married couples and their playful dynamics", "popularity_score": 82},
    {"name": "Wagle Ki Duniya", "channel": "SAB TV", "genre": "comedy", "description": "Slice-of-life comedy about a middle-class family in Mumbai", "popularity_score": 88},
    {"name": "Mere Dad Ki Dulhan", "channel": "SAB TV", "genre": "drama", "description": "Drama series about family relationships and a father's second marriage", "popularity_score": 74},

    # ═══════════════════════════════════════════════════════════════════════════
    #  STAR PLUS
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Yeh Rishta Kya Kehlata Hai", "channel": "Star Plus", "genre": "drama", "description": "Long-running family drama about the Goenka family", "popularity_score": 99},
    {"name": "Yeh Hai Mohabbatein", "channel": "Star Plus", "genre": "romance", "description": "Romantic drama about the lives of Raman and Ishita", "popularity_score": 94},
    {"name": "Ishq Subhan Allah", "channel": "Star Plus", "genre": "romance", "description": "Romantic drama about a married couple navigating modern relationships", "popularity_score": 82},
    {"name": "Kyunki Saas Bhi Kabhi Bahu Thi", "channel": "Star Plus", "genre": "drama", "description": "Iconic family drama about the Virani family", "popularity_score": 95},
    {"name": "Kahaani Ghar Ghar Kii", "channel": "Star Plus", "genre": "drama", "description": "Family drama about the lives of the Agarwal family", "popularity_score": 92},
    {"name": "Kasautii Zindagii Kay", "channel": "Star Plus", "genre": "romance", "description": "Romantic drama series about love and relationships", "popularity_score": 90},
    {"name": "Diya Aur Baati Hum", "channel": "Star Plus", "genre": "drama", "description": "Drama series about a couple with big dreams and family values", "popularity_score": 91},
    {"name": "Saath Nibhaana Saathiya", "channel": "Star Plus", "genre": "drama", "description": "Family drama about the Modi family and their relationships", "popularity_score": 93},
    {"name": "Mann Ki Awaaz Pratigya", "channel": "Star Plus", "genre": "drama", "description": "Drama series about a strong-willed woman fighting for justice", "popularity_score": 84},
    {"name": "Pyaar Ka Punchnama", "channel": "Star Plus", "genre": "romance", "description": "Romantic comedy series based on the popular film franchise", "popularity_score": 76},
    {"name": "Dance Plus", "channel": "Star Plus", "genre": "reality", "description": "Popular dance reality show judged by Remo D'Souza", "popularity_score": 78},
    {"name": "Koi Laut Ke Aaya Hai", "channel": "Star Plus", "genre": "thriller", "description": "Supernatural thriller series about reincarnation", "popularity_score": 72},

    # ═══════════════════════════════════════════════════════════════════════════
    #  SONY TV
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "CID", "channel": "Sony TV", "genre": "crime", "description": "Longest-running Indian crime investigation series", "popularity_score": 98},
    {"name": "Indian Idol", "channel": "Sony TV", "genre": "reality", "description": "Popular singing reality show discovering new talent across India", "popularity_score": 96},
    {"name": "Kaun Banega Crorepati", "channel": "Sony TV", "genre": "reality", "description": "Indian version of Who Wants to Be a Millionaire? hosted by Amitabh Bachchan", "popularity_score": 97},
    {"name": "The Voice India", "channel": "Sony TV", "genre": "reality", "description": "Singing reality show based on the international format", "popularity_score": 85},
    {"name": "Super Dancer", "channel": "Sony TV", "genre": "reality", "description": "Dance reality show featuring young talented dancers", "popularity_score": 80},
    {"name": "Mere Sai", "channel": "Sony TV", "genre": "spiritual", "description": "Spiritual drama based on the life of Sai Baba of Shirdi", "popularity_score": 90},
    {"name": "Patiala Babes", "channel": "Sony TV", "genre": "drama", "description": "Family drama about a mother-daughter duo from Patiala", "popularity_score": 78},
    {"name": "Vighnaharta Ganesh", "channel": "Sony TV", "genre": "mythological", "description": "Mythological series depicting the life of Lord Ganesha", "popularity_score": 88},
    {"name": "Crime Patrol", "channel": "Sony TV", "genre": "crime", "description": "True crime anthology series reenacting real criminal cases", "popularity_score": 92},
    {"name": "The Kapil Sharma Show", "channel": "Sony TV", "genre": "comedy", "description": "Popular comedy talk show (currently airing on Sony TV)", "popularity_score": 97},
    {"name": "Bade Achhe Lagte Hain", "channel": "Sony TV", "genre": "romance", "description": "Romantic drama about two mature individuals finding love", "popularity_score": 88},
    {"name": "Ek Rishta Saajhedari Ka", "channel": "Sony TV", "genre": "drama", "description": "Family drama about relationships and bonds", "popularity_score": 76},

    # ═══════════════════════════════════════════════════════════════════════════
    #  COLORS TV
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Bigg Boss", "channel": "Colors TV", "genre": "reality", "description": "Indian version of the reality show Big Brother, hosted by Salman Khan", "popularity_score": 98},
    {"name": "Balika Vadhu", "channel": "Colors TV", "genre": "drama", "description": "Award-winning drama series about child marriage and women's empowerment", "popularity_score": 95},
    {"name": "Udaan", "channel": "Colors TV", "genre": "drama", "description": "Drama series about a young girl fighting against child labor", "popularity_score": 86},
    {"name": "Shakti - Astitva Ke Ehsaas Ki", "channel": "Colors TV", "genre": "drama", "description": "Social drama about a transgender woman's journey for acceptance", "popularity_score": 88},
    {"name": "Naagin", "channel": "Colors TV", "genre": "supernatural", "description": "Supernatural drama about shape-shifting serpent women", "popularity_score": 94},
    {"name": "Khatron Ke Khiladi", "channel": "Colors TV", "genre": "reality", "description": "Indian version of Fear Factor with celebrity contestants", "popularity_score": 91},
    {"name": "Dance Deewane", "channel": "Colors TV", "genre": "reality", "description": "Dance reality show for contestants of all ages", "popularity_score": 80},
    {"name": "Molkki", "channel": "Colors TV", "genre": "drama", "description": "Drama series about the practice of bride buying", "popularity_score": 78},
    {"name": "Choti Sarrdaarni", "channel": "Colors TV", "genre": "drama", "description": "Drama series about a young girl's journey in a complex family", "popularity_score": 80},
    {"name": "Bepanah Pyaar", "channel": "Colors TV", "genre": "romance", "description": "Romantic thriller about love and mystery", "popularity_score": 76},

    # ═══════════════════════════════════════════════════════════════════════════
    #  ZEE TV
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Kumkum Bhagya", "channel": "Zee TV", "genre": "drama", "description": "Popular family drama series", "popularity_score": 94},
    {"name": "Kundali Bhagya", "channel": "Zee TV", "genre": "drama", "description": "Spin-off family drama series", "popularity_score": 92},
    {"name": "Fear Files", "channel": "Zee TV", "genre": "horror", "description": "Horror anthology series featuring supernatural stories", "popularity_score": 82},
    {"name": "Ishq Subhan Allah", "channel": "Zee TV", "genre": "romance", "description": "Romantic drama series", "popularity_score": 80},
    {"name": "Bhagya Lakshmi", "channel": "Zee TV", "genre": "drama", "description": "Family drama about a young woman's journey", "popularity_score": 84},
    {"name": "Zee Horror Show", "channel": "Zee TV", "genre": "horror", "description": "Classic horror anthology television series", "popularity_score": 78},
    {"name": "Dance India Dance", "channel": "Zee TV", "genre": "reality", "description": "Popular dance reality show franchise", "popularity_score": 85},
    {"name": "Sapne Suhane Ladakpan Ke", "channel": "Zee TV", "genre": "drama", "description": "Coming-of-age family drama", "popularity_score": 76},

    # ═══════════════════════════════════════════════════════════════════════════
    #  MTV INDIA
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "MTV Roadies", "channel": "MTV India", "genre": "reality", "description": "Longest-running Indian adventure reality show", "popularity_score": 93},
    {"name": "MTV Splitsvilla", "channel": "MTV India", "genre": "reality", "description": "Youth dating reality show", "popularity_score": 85},
    {"name": "Ace of Space", "channel": "MTV India", "genre": "reality", "description": "Reality show where contestants live in isolation", "popularity_score": 74},
    {"name": "MTV Love School", "channel": "MTV India", "genre": "reality", "description": "Dating and relationships advice show", "popularity_score": 72},

    # ═══════════════════════════════════════════════════════════════════════════
    #  NETWORK18 / VH1 INDIA
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Comedy Nights Bachao", "channel": "Comedy Central", "genre": "comedy", "description": "Stand-up comedy roast show", "popularity_score": 80},
    {"name": "The Great Indian Laughter Challenge", "channel": "Comedy Central", "genre": "comedy", "description": "Stand-up comedy competition series", "popularity_score": 84},

    # ═══════════════════════════════════════════════════════════════════════════
    #  &TV
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Santoshi Maa", "channel": "&TV", "genre": "mythological", "description": "Mythological drama series about Goddess Santoshi", "popularity_score": 78},
    {"name": "Gangaa", "channel": "&TV", "genre": "drama", "description": "Drama series about a young widow's journey", "popularity_score": 76},
    {"name": "Meri Aashiqui Tum Se Hi", "channel": "&TV", "genre": "romance", "description": "Romantic drama series about true love", "popularity_score": 80},
    {"name": "Bhabhi Ji Ghar Par Hai", "channel": "&TV", "genre": "comedy", "description": "Comedy series about family relationships", "popularity_score": 82},

    # ═══════════════════════════════════════════════════════════════════════════
    #  DISNEY INDIA / STAR BHARAT
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Krishna Cottage", "channel": "Star Bharat", "genre": "supernatural", "description": "Supernatural thriller series", "popularity_score": 74},
    {"name": "Mahabharat", "channel": "Star Plus", "genre": "mythological", "description": "Epic mythological series based on the Mahabharata", "popularity_score": 96},
    {"name": "Devon Ke Dev Mahadev", "channel": "Star Plus/Life OK", "genre": "mythological", "description": "Mythological series on Lord Shiva", "popularity_score": 94},
    {"name": "Ramayan", "channel": "Star Plus", "genre": "mythological", "description": "Epic mythological series based on the Ramayana", "popularity_score": 97},

    # ═══════════════════════════════════════════════════════════════════════════
    #  HOTSTAR / DISNEY+ HOTSTAR ORIGINALS
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Aarya", "channel": "Hotstar", "genre": "crime", "description": "Crime drama about a woman taking over her husband's criminal empire", "popularity_score": 88},
    {"name": "Special Ops", "channel": "Hotstar", "genre": "thriller", "description": "Spy thriller series about India's intelligence operations", "popularity_score": 84},
    {"name": "Hostages", "channel": "Hotstar", "genre": "thriller", "description": "Thriller series about a family taken hostage", "popularity_score": 78},
]


# ─── Database helpers & seeding logic ─────────────────────────────────────────

def get_database_url() -> str:
    """Get the database URL from environment or prompt."""
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    return "host=localhost user=postgres password=password dbname=playlist port=5432 sslmode=disable"


def parse_dsn(dsn: str) -> dict:
    """Parse a libpq-style connection string or URI into psycopg2 kwargs."""
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

    params = {}
    for part in dsn.split():
        if "=" in part:
            key, value = part.split("=", 1)
            params[key.strip()] = value.strip()
    return params


def seed_tv_series(conn):
    """Insert TV series that don't already exist in the database."""
    cur = conn.cursor()

    cur.execute("SELECT name, channel FROM tv_series")
    existing = {(row[0], row[1]) for row in cur.fetchall()}
    print(f"Existing TV series entries in DB: {len(existing)}")

    # Dedup by (name, channel)
    to_insert = [s for s in TV_SERIES if (s["name"], s["channel"]) not in existing]
    if not to_insert:
        print("No new TV series to add. All series already in database.")
        return

    now = datetime.now(timezone.utc)
    values = []
    for s in to_insert:
        values.append((
            s["name"], s["channel"], s["genre"],
            s.get("description", ""),
            s["popularity_score"],
            True,
            now, now,
        ))

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO tv_series (name, channel, genre, description,
                               popularity_score, is_active, created_at, updated_at)
        VALUES %s
        """,
        values,
        template="(%s, %s, %s, %s, %s, %s, %s, %s)",
    )
    conn.commit()

    print(f"✅ Added {len(to_insert)} new TV series:")
    for s in to_insert:
        print(f"   - {s['name']} ({s['channel']}, score: {s['popularity_score']})")


def main():
    dsn = get_database_url()
    params = parse_dsn(dsn)

    print(f"Connecting to database...")
    conn = psycopg2.connect(**params)
    conn.autocommit = False

    try:
        seed_tv_series(conn)
    finally:
        conn.close()

    # Count by channel
    channel_counts = Counter(s["channel"] for s in TV_SERIES)
    print(f"\n📊 Total TV series: {len(TV_SERIES)}")
    print("   By channel:")
    for channel, count in sorted(channel_counts.items()):
        print(f"     {channel}: {count}")
    print("\nDone! TV series seeded successfully.")


if __name__ == "__main__":
    main()
