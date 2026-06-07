#!/usr/bin/env python3
"""
Seed the singers table with curated popular artists across 16 genres.
Idempotent — only inserts singers that don't already exist (matched by name).

Usage:
    python3 scripts/seed_singers.py
    DATABASE_URL="postgres://user:pass@localhost:5432/playlist" python3 scripts/seed_singers.py

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


# ─── Singer Data ──────────────────────────────────────────────────────────────

SINGERS = [
    # ═══════════════════════════════════════════════════════════════════════════
    #  PUNJABI
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Diljit Dosanjh", "genre": "punjabi", "description": "Punjabi singer, songwriter, and actor", "youtube_channel_id": "UCdQ3fZU5OWOl0sOEh6w7zAQ", "popularity_score": 99},
    {"name": "AP Dhillon", "genre": "punjabi", "description": "Punjabi singer, rapper, and record producer", "youtube_channel_id": "UCGLeD6r4LajJq0BvR8OqEAg", "popularity_score": 98},
    {"name": "Sidhu Moose Wala", "genre": "punjabi", "description": "Punjabi singer, rapper, and songwriter", "popularity_score": 97},
    {"name": "Karan Aujla", "genre": "punjabi", "description": "Punjabi singer, rapper, and songwriter", "popularity_score": 96},
    {"name": "Shubh", "genre": "punjabi", "description": "Punjabi singer, global sensation with hip-hop infused sound", "popularity_score": 95},
    {"name": "Arjan Dhillon", "genre": "punjabi", "description": "Punjabi singer and versatile songwriter, known for lyrical depth", "popularity_score": 93},
    {"name": "Cheema Y", "genre": "punjabi", "description": "Punjabi rapper, breakout star with distinct style", "popularity_score": 87},
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
    {"name": "Navaan Sandhu", "genre": "punjabi", "description": "Punjabi singer and rapper, rising star in pop-rap", "popularity_score": 82},
    {"name": "Kirat Gill", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 80},
    {"name": "Harmanjeet Singh", "genre": "punjabi", "description": "Punjabi folk singer", "popularity_score": 60},
    {"name": "Gurlez Akhtar", "genre": "punjabi", "description": "Punjabi singer, known for powerful vocals", "popularity_score": 63},
    # New Punjabi additions
    {"name": "The PropheC", "genre": "punjabi", "description": "Punjabi R&B singer and songwriter", "popularity_score": 78},
    {"name": "Bohemia", "genre": "punjabi", "description": "Punjabi rapper, pioneer of desi hip-hop", "popularity_score": 85},
    {"name": "Khan Bhaini", "genre": "punjabi", "description": "Punjabi singer with romantic hits", "popularity_score": 76},
    {"name": "Veet Baljit", "genre": "punjabi", "description": "Punjabi singer, known for 'Chann Chann'", "popularity_score": 72},
    {"name": "Millind Gaba", "genre": "punjabi", "description": "Punjabi singer and music producer", "popularity_score": 80},
    {"name": "Inder Chahal", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 71},
    {"name": "Shipra Goyal", "genre": "punjabi", "description": "Punjabi female singer", "popularity_score": 74},
    {"name": "Maninder Singh", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 69},
    {"name": "Guri", "genre": "punjabi", "description": "Punjabi singer", "popularity_score": 77},
    {"name": "Sippy Gill", "genre": "punjabi", "description": "Punjabi pop singer", "popularity_score": 68},

    # ═══════════════════════════════════════════════════════════════════════════
    #  HARYANVI
    # ═══════════════════════════════════════════════════════════════════════════
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
    {"name": "Dhanda Nyoliwala", "genre": "haryanvi", "description": "Haryanvi rapper with urban-inflected style", "popularity_score": 90},
    {"name": "Raj Mawar", "genre": "haryanvi", "description": "Haryanvi singer, consistent hitmaker in dance tracks", "popularity_score": 84},
    {"name": "Vikram Sarkar", "genre": "haryanvi", "description": "Haryanvi singer, rising presence on trending playlists", "popularity_score": 80},
    {"name": "Renuka Panwar", "genre": "haryanvi", "description": "Haryanvi female singer, primary female vocal force", "popularity_score": 82},
    {"name": "Krishan Chauhan", "genre": "haryanvi", "description": "Haryanvi singer, traditional-modern fusion", "popularity_score": 77},
    {"name": "Banjaare (Sumit & Anuj)", "genre": "haryanvi", "description": "Haryanvi duo, Billboard India hitmakers", "popularity_score": 79},
    {"name": "Anil Prem Nagariya", "genre": "haryanvi", "description": "Haryanvi singer with YouTube jukebox hits", "popularity_score": 74},
    {"name": "Sapna Choudhary", "genre": "haryanvi", "description": "Haryanvi dancer, singer, and entertainer", "popularity_score": 89},
    {"name": "Ajay Hooda", "genre": "haryanvi", "description": "Haryanvi lyricist, singer, and performer", "popularity_score": 83},
    {"name": "Diler Kharkiya", "genre": "haryanvi", "description": "Haryanvi singer known for hit songs", "popularity_score": 81},
    {"name": "Gulzaar Chhaniwala", "genre": "haryanvi", "description": "Haryanvi youth icon with distinct rap style", "popularity_score": 79},
    {"name": "Pranjal Dahiya", "genre": "haryanvi", "description": "Haryanvi actress and music video star", "popularity_score": 76},
    {"name": "Vikram Singh", "genre": "haryanvi", "description": "Haryanvi singer and performer", "popularity_score": 73},
    {"name": "MC Square", "genre": "haryanvi", "description": "Haryanvi rapper who brought regional music to national platforms", "popularity_score": 71},
    # New Haryanvi additions
    {"name": "Komal Choudhary", "genre": "haryanvi", "description": "Haryanvi female singer", "popularity_score": 70},
    {"name": "Navi Rajpoot", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 68},
    {"name": "Gaurav Chhokar", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 66},
    {"name": "Fiza", "genre": "haryanvi", "description": "Haryanvi female singer", "popularity_score": 64},
    {"name": "Deep Narveer", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 62},
    {"name": "Mukesh Suthar", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 60},
    {"name": "Chetan Raghav", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 61},
    {"name": "Rahul Kadyan", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 63},
    {"name": "Aryan Sharma", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 59},
    {"name": "Sachin Dagar", "genre": "haryanvi", "description": "Haryanvi singer", "popularity_score": 57},

    # ═══════════════════════════════════════════════════════════════════════════
    #  HINDI (Modern)
    # ═══════════════════════════════════════════════════════════════════════════
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
    {"name": "KK", "genre": "hindi", "description": "Indian playback singer, soulful romantic vocals", "popularity_score": 91},
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
    # New Hindi additions
    {"name": "Yo Yo Honey Singh", "genre": "hindi", "description": "Indian rapper, singer, and music producer", "popularity_score": 92},
    {"name": "A.R. Rahman", "genre": "hindi", "description": "Indian composer and singer, Oscar winner", "popularity_score": 97},
    {"name": "Shaan", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 78},
    {"name": "Kailash Kher", "genre": "hindi", "description": "Indian folk-pop and playback singer", "popularity_score": 85},
    {"name": "Sukhwinder Singh", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 76},
    {"name": "Hariharan", "genre": "hindi", "description": "Indian playback singer and ghazal maestro", "popularity_score": 83},
    {"name": "Roop Kumar Rathod", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 74},
    {"name": "Kavita Krishnamurthy", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 82},
    {"name": "Sadhana Sargam", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 78},
    {"name": "Anuradha Paudwal", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 76},
    {"name": "Abhijeet Bhattacharya", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 77},
    {"name": "Sonu Kakkar", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 68},
    {"name": "Akhil Sachdeva", "genre": "hindi", "description": "Indian singer and composer", "popularity_score": 72},
    {"name": "Amit Mishra", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 70},
    {"name": "Ankit Tiwari", "genre": "hindi", "description": "Indian singer and composer", "popularity_score": 73},
    {"name": "Mithoon", "genre": "hindi", "description": "Indian music composer and singer", "popularity_score": 75},
    {"name": "Tony Kakkar", "genre": "hindi", "description": "Indian singer and music composer", "popularity_score": 79},
    {"name": "Stebin Ben", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 71},
    {"name": "Rashmeet Kaur", "genre": "hindi", "description": "Indian singer", "popularity_score": 65},
    {"name": "Nikita Gandhi", "genre": "hindi", "description": "Indian playback singer", "popularity_score": 67},

    # ═══════════════════════════════════════════════════════════════════════════
    #  OLD HINDI
    # ═══════════════════════════════════════════════════════════════════════════
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
    # New Old Hindi additions
    {"name": "Pankaj Mullick", "genre": "old-hindi", "description": "Indian playback singer and music composer", "popularity_score": 74},
    {"name": "Kanan Devi", "genre": "old-hindi", "description": "Indian playback singer and actress", "popularity_score": 73},
    {"name": "Suraiya", "genre": "old-hindi", "description": "Indian playback singer and actress", "popularity_score": 72},
    {"name": "Begum Akhtar", "genre": "old-hindi", "description": "Indian ghazal and playback singer", "popularity_score": 76},
    {"name": "M.S. Subbulakshmi", "genre": "old-hindi", "description": "Legendary Indian classical vocalist", "popularity_score": 85},
    {"name": "Bade Ghulam Ali Khan", "genre": "old-hindi", "description": "Indian classical vocalist, Patiala gharana", "popularity_score": 80},
    {"name": "Bhimsen Joshi", "genre": "old-hindi", "description": "Indian classical vocalist, Kirana gharana", "popularity_score": 82},

    # ═══════════════════════════════════════════════════════════════════════════
    #  ENGLISH
    # ═══════════════════════════════════════════════════════════════════════════
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
    # New English additions
    {"name": "Beyoncé", "genre": "english", "description": "American singer, songwriter, and cultural icon", "popularity_score": 96, "youtube_channel_id": "UCuHzBCFaKMpUBbWBsGD0hqg"},
    {"name": "Lady Gaga", "genre": "english", "description": "American singer, songwriter, and actress", "popularity_score": 92},
    {"name": "Justin Bieber", "genre": "english", "description": "Canadian singer and pop star", "popularity_score": 94},
    {"name": "Shawn Mendes", "genre": "english", "description": "Canadian singer-songwriter", "popularity_score": 84},
    {"name": "Sam Smith", "genre": "english", "description": "English singer and songwriter", "popularity_score": 83},
    {"name": "Lewis Capaldi", "genre": "english", "description": "Scottish singer-songwriter", "popularity_score": 80},
    {"name": "Elton John", "genre": "english", "description": "English singer, pianist, and composer", "popularity_score": 95},
    {"name": "Queen", "genre": "english", "description": "British rock band, legends", "popularity_score": 94},
    {"name": "Michael Jackson", "genre": "english", "description": "American singer, King of Pop", "popularity_score": 99},
    {"name": "Prince", "genre": "english", "description": "American singer and multi-instrumentalist", "popularity_score": 92},
    {"name": "David Bowie", "genre": "english", "description": "English singer and cultural icon", "popularity_score": 90},
    {"name": "Led Zeppelin", "genre": "english", "description": "English rock band", "popularity_score": 91},
    {"name": "Pink Floyd", "genre": "english", "description": "English rock band, progressive pioneers", "popularity_score": 91},
    {"name": "Radiohead", "genre": "english", "description": "English rock band, alternative pioneers", "popularity_score": 86},
    {"name": "Arctic Monkeys", "genre": "english", "description": "English rock band", "popularity_score": 84},
    {"name": "Tame Impala", "genre": "english", "description": "Australian psychedelic music project", "popularity_score": 80},
    {"name": "J. Cole", "genre": "english", "description": "American rapper and record producer", "popularity_score": 88},
    {"name": "Lil Wayne", "genre": "english", "description": "American rapper and songwriter", "popularity_score": 86},
    {"name": "Jay-Z", "genre": "english", "description": "American rapper and entrepreneur", "popularity_score": 90},
    {"name": "Usher", "genre": "english", "description": "American singer and entertainer", "popularity_score": 85},
    {"name": "Chris Brown", "genre": "english", "description": "American singer and dancer", "popularity_score": 84},
    {"name": "Calvin Harris", "genre": "english", "description": "Scottish DJ and record producer", "popularity_score": 85},
    {"name": "David Guetta", "genre": "english", "description": "French DJ and record producer", "popularity_score": 84},
    {"name": "Alesso", "genre": "english", "description": "Swedish DJ and record producer", "popularity_score": 76},
    {"name": "Avicii", "genre": "english", "description": "Swedish DJ and electronic musician", "popularity_score": 88},
    {"name": "Marshmello", "genre": "english", "description": "American electronic DJ and producer", "popularity_score": 82},

    # ═══════════════════════════════════════════════════════════════════════════
    #  TAMIL
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "A.R. Rahman", "genre": "tamil", "description": "Legendary Indian composer, singer, Oscar winner", "popularity_score": 100},
    {"name": "Anirudh Ravichander", "genre": "tamil", "description": "Tamil music composer and singer", "popularity_score": 96},
    {"name": "Yuvan Shankar Raja", "genre": "tamil", "description": "Tamil music composer and singer", "popularity_score": 94},
    {"name": "Ilaiyaraaja", "genre": "tamil", "description": "Legendary Indian composer and singer", "popularity_score": 98},
    {"name": "S.P. Balasubrahmanyam", "genre": "tamil", "description": "Legendary Indian playback singer", "popularity_score": 99},
    {"name": "K.J. Yesudas", "genre": "tamil", "description": "Indian playback singer and classical vocalist", "popularity_score": 95},
    {"name": "P. Susheela", "genre": "tamil", "description": "Veteran Indian playback singer", "popularity_score": 93},
    {"name": "S. Janaki", "genre": "tamil", "description": "Veteran Indian playback singer", "popularity_score": 92},
    {"name": "Vani Jairam", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 88},
    {"name": "K.S. Chithra", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 90},
    {"name": "Unni Menon", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 82},
    {"name": "Bombay Jayashree", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Sirkazhi Govindarajan", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 76},
    {"name": "T.M. Soundararajan", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "P.B. Sreenivas", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 78},
    {"name": "M. Balamuralikrishna", "genre": "tamil", "description": "Indian classical vocalist and playback singer", "popularity_score": 85},
    {"name": "Harris Jayaraj", "genre": "tamil", "description": "Tamil music composer", "popularity_score": 88},
    {"name": "Santhosh Narayanan", "genre": "tamil", "description": "Tamil music composer", "popularity_score": 84},
    {"name": "G.V. Prakash Kumar", "genre": "tamil", "description": "Tamil composer and actor", "popularity_score": 82},
    {"name": "Hiphop Tamizha", "genre": "tamil", "description": "Tamil hip-hop duo", "popularity_score": 80},
    {"name": "Sid Sriram", "genre": "tamil", "description": "Indian playback singer and songwriter", "popularity_score": 88},
    {"name": "Dhanush", "genre": "tamil", "description": "Tamil actor and singer", "popularity_score": 86},
    {"name": "Sean Roldan", "genre": "tamil", "description": "Tamil music composer and singer", "popularity_score": 74},
    {"name": "Vijay Antony", "genre": "tamil", "description": "Tamil music composer and singer", "popularity_score": 76},
    {"name": "Deva", "genre": "tamil", "description": "Tamil music composer", "popularity_score": 78},
    {"name": "Shreya Ghoshal", "genre": "tamil", "description": "Indian playback singer (also sings in Tamil)", "popularity_score": 93},
    {"name": "Karthik", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Vijay Prakash", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 78},
    {"name": "Benny Dayal", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 79},
    {"name": "Swarnalatha", "genre": "tamil", "description": "Indian playback singer, National Award winner", "popularity_score": 82},
    {"name": "Saindhavi", "genre": "tamil", "description": "Indian playback singer", "popularity_score": 70},
    {"name": "V.V. Prassanna", "genre": "tamil", "description": "Carnatic vocalist and playback singer", "popularity_score": 72},
    {"name": "Niranjana Ramanan", "genre": "tamil", "description": "Tamil playback singer", "popularity_score": 68},

    # ═══════════════════════════════════════════════════════════════════════════
    #  TELUGU
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "S.P. Balasubrahmanyam", "genre": "telugu", "description": "Legendary Indian playback singer", "popularity_score": 100},
    {"name": "K.J. Yesudas", "genre": "telugu", "description": "Indian playback singer and classical vocalist", "popularity_score": 95},
    {"name": "P. Susheela", "genre": "telugu", "description": "Veteran Indian playback singer", "popularity_score": 93},
    {"name": "S. Janaki", "genre": "telugu", "description": "Veteran Indian playback singer", "popularity_score": 92},
    {"name": "K.S. Chithra", "genre": "telugu", "description": "Indian playback singer", "popularity_score": 91},
    {"name": "M.M. Keeravani", "genre": "telugu", "description": "Indian composer and singer, Oscar winner", "popularity_score": 97},
    {"name": "Thaman S", "genre": "telugu", "description": "Telugu music composer and singer", "popularity_score": 92},
    {"name": "Devi Sri Prasad", "genre": "telugu", "description": "Telugu music composer and singer", "popularity_score": 94},
    {"name": "Mickey J. Meyer", "genre": "telugu", "description": "Telugu music composer", "popularity_score": 80},
    {"name": "Rahul Sipligunj", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 76},
    {"name": "Kaala Bhairava", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 78},
    {"name": "Ramya Behara", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 72},
    {"name": "Geetha Madhuri", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 74},
    {"name": "Mano", "genre": "telugu", "description": "Indian playback singer", "popularity_score": 78},
    {"name": "S.P. Sailaja", "genre": "telugu", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Ghantasala", "genre": "telugu", "description": "Legendary Indian playback singer and composer", "popularity_score": 95},
    {"name": "P.B. Sreenivas", "genre": "telugu", "description": "Indian playback singer", "popularity_score": 82},
    {"name": "T.M. Soundararajan", "genre": "telugu", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Vani Jairam", "genre": "telugu", "description": "Indian playback singer", "popularity_score": 85},
    {"name": "Sirkazhi Govindarajan", "genre": "telugu", "description": "Indian playback singer", "popularity_score": 74},
    {"name": "Shankar Mahadevan", "genre": "telugu", "description": "Indian playback singer and composer", "popularity_score": 86},
    {"name": "M. Balamuralikrishna", "genre": "telugu", "description": "Indian classical vocalist and playback singer", "popularity_score": 84},
    {"name": "Hemachandra", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 76},
    {"name": "Chaitra Ambadipudi", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 70},
    {"name": "Padmalatha", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 72},
    {"name": "Anurag Kulkarni", "genre": "telugu", "description": "Telugu playback singer", "popularity_score": 75},

    # ═══════════════════════════════════════════════════════════════════════════
    #  BENGALI
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Rabindranath Tagore", "genre": "bengali", "description": "Nobel laureate poet and composer of Rabindra Sangeet", "popularity_score": 100},
    {"name": "R.D. Burman", "genre": "bengali", "description": "Legendary Indian music composer", "popularity_score": 95},
    {"name": "Hemanta Mukherjee", "genre": "bengali", "description": "Indian playback singer and composer", "popularity_score": 92},
    {"name": "Sandhya Mukherjee", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 88},
    {"name": "Shyamal Mitra", "genre": "bengali", "description": "Indian playback singer and composer", "popularity_score": 86},
    {"name": "Dwijen Mukhopadhyay", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 84},
    {"name": "Manabendra Mukhopadhyay", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 82},
    {"name": "Pratima Bandyopadhyay", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Arati Mukherjee", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 78},
    {"name": "Shibaji Chatterjee", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 76},
    {"name": "Indrani Sen", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 74},
    {"name": "Srikanta Acharya", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 76},
    {"name": "Anup Ghoshal", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 80},
    {"name": "Swagatalakshmi Dasgupta", "genre": "bengali", "description": "Indian classical and playback singer", "popularity_score": 75},
    {"name": "Srabani Sen", "genre": "bengali", "description": "Indian playback singer", "popularity_score": 72},
    {"name": "Nachiketa", "genre": "bengali", "description": "Indian singer and composer", "popularity_score": 78},
    {"name": "Bappi Lahiri", "genre": "bengali", "description": "Indian singer and music composer", "popularity_score": 85},
    {"name": "Upal Sengupta", "genre": "bengali", "description": "Bengali playback singer", "popularity_score": 70},
    {"name": "Somlata", "genre": "bengali", "description": "Bengali playback singer", "popularity_score": 72},
    {"name": "Silajit Majumder", "genre": "bengali", "description": "Bengali playback singer", "popularity_score": 74},
    {"name": "Rupankar", "genre": "bengali", "description": "Bengali playback singer", "popularity_score": 76},
    {"name": "Ajoy Chakrabarty", "genre": "bengali", "description": "Indian classical vocalist", "popularity_score": 80},
    {"name": "Shreya Ghoshal", "genre": "bengali", "description": "Indian playback singer (also sings in Bengali)", "popularity_score": 93},
    {"name": "Arijit Singh", "genre": "bengali", "description": "Indian playback singer (also sings in Bengali)", "popularity_score": 95},
    {"name": "Iman Chakraborty", "genre": "bengali", "description": "Bengali playback singer", "popularity_score": 72},
    {"name": "Madhubanti Bagchi", "genre": "bengali", "description": "Bengali playback singer", "popularity_score": 74},
    {"name": "Kumar Sanu", "genre": "bengali", "description": "Indian playback singer (also sings in Bengali)", "popularity_score": 82},

    # ═══════════════════════════════════════════════════════════════════════════
    #  MARATHI
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Sudhir Phadke", "genre": "marathi", "description": "Marathi singer and composer", "popularity_score": 90},
    {"name": "Suresh Wadkar", "genre": "marathi", "description": "Indian playback singer (Marathi and Hindi)", "popularity_score": 88},
    {"name": "Ravindra Sathe", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 84},
    {"name": "Aarti Anklikar-Tikekar", "genre": "marathi", "description": "Indian classical and playback singer", "popularity_score": 78},
    {"name": "Anand Shinde", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 76},
    {"name": "Vaishali Samant", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 74},
    {"name": "Bela Shende", "genre": "marathi", "description": "Indian playback singer", "popularity_score": 76},
    {"name": "Devaki Pandit", "genre": "marathi", "description": "Indian playback singer", "popularity_score": 72},
    {"name": "Shreeram Lagoo", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 70},
    {"name": "Shridhar Phadke", "genre": "marathi", "description": "Marathi composer and singer", "popularity_score": 82},
    {"name": "Jitendra Abhisheki", "genre": "marathi", "description": "Indian classical vocalist and composer", "popularity_score": 86},
    {"name": "Mahesh Kale", "genre": "marathi", "description": "Marathi playback singer, National Award winner", "popularity_score": 80},
    {"name": "Salil Kulkarni", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 74},
    {"name": "Ketaki Mategaonkar", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 72},
    {"name": "Manjiri Kelkar", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 70},
    {"name": "Sonali Sonawane", "genre": "marathi", "description": "Marathi playback singer", "popularity_score": 68},
    {"name": "Shankar Mahadevan", "genre": "marathi", "description": "Indian playback singer (also sings in Marathi)", "popularity_score": 85},
    {"name": "Shreya Ghoshal", "genre": "marathi", "description": "Indian playback singer (also sings in Marathi)", "popularity_score": 90},
    {"name": "Ajay-Atul", "genre": "marathi", "description": "Marathi music composer duo", "popularity_score": 92},
    {"name": "Hridaynath Mangeshkar", "genre": "marathi", "description": "Marathi composer and singer", "popularity_score": 88},

    # ═══════════════════════════════════════════════════════════════════════════
    #  BHOJPURI
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Pawan Singh", "genre": "bhojpuri", "description": "Bhojpuri singer and actor", "popularity_score": 95},
    {"name": "Dinesh Lal Yadav", "genre": "bhojpuri", "description": "Bhojpuri singer and actor", "popularity_score": 93},
    {"name": "Khesari Lal Yadav", "genre": "bhojpuri", "description": "Bhojpuri singer and actor", "popularity_score": 94},
    {"name": "Manoj Tiwari", "genre": "bhojpuri", "description": "Bhojpuri singer and politician", "popularity_score": 90},
    {"name": "Rakesh Mishra", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 82},
    {"name": "Ankush Raja", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 80},
    {"name": "Priyanka Singh", "genre": "bhojpuri", "description": "Bhojpuri female singer", "popularity_score": 78},
    {"name": "Sharda Sinha", "genre": "bhojpuri", "description": "Bhojpuri and Maithili folk singer", "popularity_score": 88},
    {"name": "Arvind Akela (Kallu)", "genre": "bhojpuri", "description": "Bhojpuri singer and actor", "popularity_score": 86},
    {"name": "Nirmala Devi", "genre": "bhojpuri", "description": "Bhojpuri folk singer", "popularity_score": 80},
    {"name": "Hemlata", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 74},
    {"name": "Shashi Yadav", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 72},
    {"name": "Sona Singh", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 70},
    {"name": "Pramod Premi", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 76},
    {"name": "Alok Kumar", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 72},
    {"name": "Guddu Rangeela", "genre": "bhojpuri", "description": "Bhojpuri singer and comedian", "popularity_score": 74},
    {"name": "Pappu Kalyani", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 68},
    {"name": "Sneha Upadhyay", "genre": "bhojpuri", "description": "Bhojpuri female singer", "popularity_score": 70},
    {"name": "Mamta Raut", "genre": "bhojpuri", "description": "Bhojpuri female singer", "popularity_score": 66},
    {"name": "Chandan Chanchal", "genre": "bhojpuri", "description": "Bhojpuri singer", "popularity_score": 75},

    # ═══════════════════════════════════════════════════════════════════════════
    #  GUJARATI
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Parthiv Gohil", "genre": "gujarati", "description": "Indian playback singer (Gujarati and Hindi)", "popularity_score": 85},
    {"name": "Atul Purohit", "genre": "gujarati", "description": "Gujarati playback singer", "popularity_score": 78},
    {"name": "Karsan Sagathiya", "genre": "gujarati", "description": "Gujarati folk singer", "popularity_score": 80},
    {"name": "Praful Dave", "genre": "gujarati", "description": "Gujarati folk and devotional singer", "popularity_score": 76},
    {"name": "Sharda Gohil", "genre": "gujarati", "description": "Gujarati playback singer", "popularity_score": 74},
    {"name": "Aarohi Patel", "genre": "gujarati", "description": "Gujarati playback singer", "popularity_score": 72},
    {"name": "Aditya Gadhvi", "genre": "gujarati", "description": "Gujarati singer, rising star in folk-pop", "popularity_score": 80},
    {"name": "Kinjal Dave", "genre": "gujarati", "description": "Gujarati singer, popular in Garba", "popularity_score": 82},
    {"name": "Vaishali Madeka (Sinh)", "genre": "gujarati", "description": "Gujarati playback singer", "popularity_score": 70},
    {"name": "Jignesh Barot", "genre": "gujarati", "description": "Gujarati folk and devotional singer", "popularity_score": 74},
    {"name": "Dilip Dholakia", "genre": "gujarati", "description": "Gujarati playback singer", "popularity_score": 72},
    {"name": "Osman Mir", "genre": "gujarati", "description": "Gujarati singer", "popularity_score": 68},
    {"name": "Rajesh Barot", "genre": "gujarati", "description": "Gujarati folk singer", "popularity_score": 70},
    {"name": "Geeta Rabari", "genre": "gujarati", "description": "Gujarati folk singer", "popularity_score": 72},
    {"name": "Bobby Sindhi", "genre": "gujarati", "description": "Gujarati singer", "popularity_score": 66},
    {"name": "Shreya Ghoshal", "genre": "gujarati", "description": "Indian playback singer (also sings in Gujarati)", "popularity_score": 90},
    {"name": "Alka Yagnik", "genre": "gujarati", "description": "Indian playback singer (also sings in Gujarati)", "popularity_score": 86},
    {"name": "Reshma Gujarati", "genre": "gujarati", "description": "Gujarati folk singer", "popularity_score": 74},
    {"name": "Vipul Kheni", "genre": "gujarati", "description": "Gujarati singer", "popularity_score": 68},
    {"name": "Dhruvi Patel", "genre": "gujarati", "description": "Gujarati playback singer", "popularity_score": 66},

    # ═══════════════════════════════════════════════════════════════════════════
    #  RAJASTHANI / FOLK
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Allah Jilai Bai", "genre": "rajasthani", "description": "Legendary Rajasthani folk singer", "popularity_score": 90},
    {"name": "Mame Khan", "genre": "rajasthani", "description": "Rajasthani folk and playback singer", "popularity_score": 85},
    {"name": "Rupinder Gandharv", "genre": "rajasthani", "description": "Rajasthani folk singer", "popularity_score": 78},
    {"name": "Kutle Khan", "genre": "rajasthani", "description": "Rajasthani folk singer and musician", "popularity_score": 82},
    {"name": "Swaroop Khan", "genre": "rajasthani", "description": "Rajasthani folk singer", "popularity_score": 76},
    {"name": "Bhungar Kanwar", "genre": "rajasthani", "description": "Rajasthani folk singer", "popularity_score": 74},
    {"name": "Chugge Khan", "genre": "rajasthani", "description": "Rajasthani folk singer", "popularity_score": 72},
    {"name": "Kheta Khan", "genre": "rajasthani", "description": "Rajasthani folk singer", "popularity_score": 70},
    {"name": "Lakhma Kanwar", "genre": "rajasthani", "description": "Rajasthani folk singer", "popularity_score": 70},
    {"name": "Barkat Khan", "genre": "rajasthani", "description": "Rajasthani folk singer", "popularity_score": 68},
    {"name": "Sona Mohapatra", "genre": "rajasthani", "description": "Indian playback and folk singer", "popularity_score": 80},
    {"name": "Nusrat Fateh Ali Khan", "genre": "rajasthani", "description": "Legendary Pakistani Qawwali singer", "popularity_score": 99},
    {"name": "Abida Parveen", "genre": "rajasthani", "description": "Pakistani Sufi and Qawwali singer", "popularity_score": 95},
    {"name": "Kailash Kher", "genre": "rajasthani", "description": "Indian folk-pop and Sufi singer", "popularity_score": 88},
    {"name": "Maithili Thakur", "genre": "rajasthani", "description": "Indian folk and devotional singer", "popularity_score": 76},
    {"name": "Shahid Mallya", "genre": "rajasthani", "description": "Indian playback singer (folk influences)", "popularity_score": 72},
    {"name": "Gurdas Maan", "genre": "rajasthani", "description": "Punjabi folk singer with wide folk appeal", "popularity_score": 88},
    {"name": "Rahim Fahimuddin Dagar", "genre": "rajasthani", "description": "Indian classical vocalist, Dagar tradition", "popularity_score": 82},
    {"name": "Huma Akram", "genre": "rajasthani", "description": "Pakistani folk and Sufi singer", "popularity_score": 70},
    {"name": "Sharda Sinha", "genre": "rajasthani", "description": "Indian folk and Maithili singer", "popularity_score": 84},

    # ═══════════════════════════════════════════════════════════════════════════
    #  K-POP
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "BTS", "genre": "k-pop", "description": "South Korean boy band, global phenomenon", "popularity_score": 100, "youtube_channel_id": "UCLkAepWjdylmFSlD9J1eSCQ"},
    {"name": "BLACKPINK", "genre": "k-pop", "description": "South Korean girl group", "popularity_score": 98, "youtube_channel_id": "UCOmHUn--16B90oW2L6FRR3A"},
    {"name": "EXO", "genre": "k-pop", "description": "South Korean-Chinese boy band", "popularity_score": 94},
    {"name": "TWICE", "genre": "k-pop", "description": "South Korean girl group", "popularity_score": 93},
    {"name": "PSY", "genre": "k-pop", "description": "South Korean singer and rapper, known for 'Gangnam Style'", "popularity_score": 92},
    {"name": "BIGBANG", "genre": "k-pop", "description": "South Korean boy band, K-pop pioneers", "popularity_score": 93},
    {"name": "Red Velvet", "genre": "k-pop", "description": "South Korean girl group", "popularity_score": 88},
    {"name": "NCT 127", "genre": "k-pop", "description": "South Korean boy band, NCT sub-unit", "popularity_score": 86},
    {"name": "Stray Kids", "genre": "k-pop", "description": "South Korean boy band, self-produced", "popularity_score": 92},
    {"name": "NewJeans", "genre": "k-pop", "description": "South Korean girl group", "popularity_score": 90},
    {"name": "SEVENTEEN", "genre": "k-pop", "description": "South Korean boy band, self-producing", "popularity_score": 88},
    {"name": "IU", "genre": "k-pop", "description": "South Korean singer-songwriter and actress", "popularity_score": 95},
    {"name": "G-Dragon", "genre": "k-pop", "description": "South Korean rapper and songwriter, BIGBANG leader", "popularity_score": 94},
    {"name": "Taeyeon", "genre": "k-pop", "description": "South Korean singer, Girls'Generation member", "popularity_score": 86},
    {"name": "Sunmi", "genre": "k-pop", "description": "South Korean singer-songwriter", "popularity_score": 82},
    {"name": "Chung Ha", "genre": "k-pop", "description": "South Korean singer and dancer", "popularity_score": 80},
    {"name": "(G)I-DLE", "genre": "k-pop", "description": "South Korean girl group, self-produced", "popularity_score": 84},
    {"name": "ITZY", "genre": "k-pop", "description": "South Korean girl group", "popularity_score": 84},
    {"name": "aespa", "genre": "k-pop", "description": "South Korean girl group, metaverse concept", "popularity_score": 83},
    {"name": "LE SSERAFIM", "genre": "k-pop", "description": "South Korean girl group", "popularity_score": 82},
    {"name": "Super Junior", "genre": "k-pop", "description": "South Korean boy band, K-pop legends", "popularity_score": 90},
    {"name": "Girls' Generation", "genre": "k-pop", "description": "South Korean girl group, 'The Nation's Girl Group'", "popularity_score": 92},
    {"name": "SHINee", "genre": "k-pop", "description": "South Korean boy band", "popularity_score": 86},
    {"name": "2NE1", "genre": "k-pop", "description": "South Korean girl group, iconic", "popularity_score": 88},
    {"name": "MAMAMOO", "genre": "k-pop", "description": "South Korean girl group, known for vocals", "popularity_score": 85},
    {"name": "Zico", "genre": "k-pop", "description": "South Korean rapper and producer", "popularity_score": 80},
    {"name": "TOMORROW X TOGETHER", "genre": "k-pop", "description": "South Korean boy band, BTS' labelmates", "popularity_score": 82},
    {"name": "ENHYPEN", "genre": "k-pop", "description": "South Korean boy band, global fanbase", "popularity_score": 80},

    # ═══════════════════════════════════════════════════════════════════════════
    #  LATIN / REGGAETON
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Bad Bunny", "genre": "latin", "description": "Puerto Rican rapper and singer, global reggaeton star", "popularity_score": 99},
    {"name": "Daddy Yankee", "genre": "latin", "description": "Puerto Rican rapper and singer, 'King of Reggaeton'", "popularity_score": 97},
    {"name": "Luis Fonsi", "genre": "latin", "description": "Puerto Rican singer, known for 'Despacito'", "popularity_score": 93},
    {"name": "Shakira", "genre": "latin", "description": "Colombian singer and dancer, global icon", "popularity_score": 96},
    {"name": "J Balvin", "genre": "latin", "description": "Colombian reggaeton singer", "popularity_score": 94},
    {"name": "Ozuna", "genre": "latin", "description": "Puerto Rican reggaeton and Latin trap singer", "popularity_score": 92},
    {"name": "Maluma", "genre": "latin", "description": "Colombian reggaeton singer", "popularity_score": 91},
    {"name": "Karol G", "genre": "latin", "description": "Colombian reggaeton singer, leading female voice", "popularity_score": 93},
    {"name": "Rosalía", "genre": "latin", "description": "Spanish singer-songwriter, flamenco-pop fusion", "popularity_score": 90},
    {"name": "Anuel AA", "genre": "latin", "description": "Puerto Rican Latin trap and reggaeton singer", "popularity_score": 86},
    {"name": "Rauw Alejandro", "genre": "latin", "description": "Puerto Rican reggaeton singer", "popularity_score": 88},
    {"name": "Becky G", "genre": "latin", "description": "American singer and actress (Latin pop origin)", "popularity_score": 82},
    {"name": "Nicky Jam", "genre": "latin", "description": "American reggaeton singer of Puerto Rican descent", "popularity_score": 88},
    {"name": "Farruko", "genre": "latin", "description": "Puerto Rican reggaeton singer", "popularity_score": 84},
    {"name": "Camilo", "genre": "latin", "description": "Colombian pop and reggaeton singer", "popularity_score": 82},
    {"name": "Feid", "genre": "latin", "description": "Colombian reggaeton singer and producer", "popularity_score": 84},
    {"name": "Manuel Turizo", "genre": "latin", "description": "Colombian reggaeton and pop singer", "popularity_score": 80},
    {"name": "Sebastián Yatra", "genre": "latin", "description": "Colombian Latin pop singer", "popularity_score": 82},
    {"name": "Natti Natasha", "genre": "latin", "description": "Dominican reggaeton singer", "popularity_score": 80},
    {"name": "Enrique Iglesias", "genre": "latin", "description": "Spanish singer and entertainer", "popularity_score": 92},
    {"name": "Marc Anthony", "genre": "latin", "description": "American salsa singer and actor", "popularity_score": 91},
    {"name": "Ricky Martin", "genre": "latin", "description": "Puerto Rican pop singer", "popularity_score": 90},
    {"name": "Romeo Santos", "genre": "latin", "description": "American bachata singer, 'King of Bachata'", "popularity_score": 88},
    {"name": "Aventura", "genre": "latin", "description": "American bachata group", "popularity_score": 86},
    {"name": "Chayanne", "genre": "latin", "description": "Puerto Rican Latin pop singer", "popularity_score": 84},
    {"name": "Juanes", "genre": "latin", "description": "Colombian rock and pop singer", "popularity_score": 82},
    {"name": "Anitta", "genre": "latin", "description": "Brazilian singer (Latin pop and funk)", "popularity_score": 85},
    {"name": "Gente de Zona", "genre": "latin", "description": "Cuban reggaeton duo", "popularity_score": 78},

    # ═══════════════════════════════════════════════════════════════════════════
    #  HIP-HOP / RAP
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Kendrick Lamar", "genre": "hip-hop-rap", "description": "American rapper, Pulitzer Prize winner", "popularity_score": 97},
    {"name": "J. Cole", "genre": "hip-hop-rap", "description": "American rapper and record producer", "popularity_score": 95},
    {"name": "Drake", "genre": "hip-hop-rap", "description": "Canadian rapper and singer", "popularity_score": 98},
    {"name": "Kanye West", "genre": "hip-hop-rap", "description": "American rapper and producer", "popularity_score": 96},
    {"name": "Travis Scott", "genre": "hip-hop-rap", "description": "American rapper and record producer", "popularity_score": 93},
    {"name": "Lil Wayne", "genre": "hip-hop-rap", "description": "American rapper and songwriter", "popularity_score": 92},
    {"name": "Jay-Z", "genre": "hip-hop-rap", "description": "American rapper and entrepreneur", "popularity_score": 94},
    {"name": "Nas", "genre": "hip-hop-rap", "description": "American rapper and songwriter, legendary lyricist", "popularity_score": 91},
    {"name": "Eminem", "genre": "hip-hop-rap", "description": "American rapper, one of the best-selling", "popularity_score": 97},
    {"name": "Tyler The Creator", "genre": "hip-hop-rap", "description": "American rapper and producer", "popularity_score": 90},
    {"name": "21 Savage", "genre": "hip-hop-rap", "description": "British-American rapper", "popularity_score": 88},
    {"name": "Future", "genre": "hip-hop-rap", "description": "American rapper and singer", "popularity_score": 89},
    {"name": "Metro Boomin", "genre": "hip-hop-rap", "description": "American record producer and rapper", "popularity_score": 90},
    {"name": "Playboi Carti", "genre": "hip-hop-rap", "description": "American rapper", "popularity_score": 86},
    {"name": "Lil Uzi Vert", "genre": "hip-hop-rap", "description": "American rapper and singer", "popularity_score": 85},
    {"name": "Baby Keem", "genre": "hip-hop-rap", "description": "American rapper and producer", "popularity_score": 82},
    {"name": "Denzel Curry", "genre": "hip-hop-rap", "description": "American rapper", "popularity_score": 80},
    {"name": "JID", "genre": "hip-hop-rap", "description": "American rapper and songwriter", "popularity_score": 82},
    {"name": "Joey Bada$$", "genre": "hip-hop-rap", "description": "American rapper and actor", "popularity_score": 80},
    {"name": "Mac Miller", "genre": "hip-hop-rap", "description": "American rapper and producer", "popularity_score": 84},
    {"name": "Juice WRLD", "genre": "hip-hop-rap", "description": "American rapper and singer", "popularity_score": 88},
    {"name": "Pop Smoke", "genre": "hip-hop-rap", "description": "American rapper, Brooklyn drill pioneer", "popularity_score": 87},
    {"name": "A$AP Rocky", "genre": "hip-hop-rap", "description": "American rapper and fashion icon", "popularity_score": 86},
    {"name": "Chance the Rapper", "genre": "hip-hop-rap", "description": "American rapper and activist", "popularity_score": 82},
    {"name": "Childish Gambino", "genre": "hip-hop-rap", "description": "American rapper, singer, and actor", "popularity_score": 85},
    {"name": "2Pac", "genre": "hip-hop-rap", "description": "Legendary American rapper and activist", "popularity_score": 98},
    {"name": "The Notorious B.I.G.", "genre": "hip-hop-rap", "description": "Legendary American rapper", "popularity_score": 97},
    {"name": "Lil Baby", "genre": "hip-hop-rap", "description": "American rapper", "popularity_score": 86},
    {"name": "Gunna", "genre": "hip-hop-rap", "description": "American rapper and singer", "popularity_score": 82},
    {"name": "Young Thug", "genre": "hip-hop-rap", "description": "American rapper and singer", "popularity_score": 84},

    # ═══════════════════════════════════════════════════════════════════════════
    #  R&B / SOUL
    # ═══════════════════════════════════════════════════════════════════════════
    {"name": "Frank Ocean", "genre": "r-and-b", "description": "American singer-songwriter", "popularity_score": 95},
    {"name": "Beyoncé", "genre": "r-and-b", "description": "American singer, cultural icon", "popularity_score": 99},
    {"name": "Alicia Keys", "genre": "r-and-b", "description": "American singer-songwriter and pianist", "popularity_score": 93},
    {"name": "John Legend", "genre": "r-and-b", "description": "American singer and songwriter", "popularity_score": 91},
    {"name": "H.E.R.", "genre": "r-and-b", "description": "American singer and multi-instrumentalist", "popularity_score": 88},
    {"name": "Summer Walker", "genre": "r-and-b", "description": "American R&B singer", "popularity_score": 85},
    {"name": "Jazmine Sullivan", "genre": "r-and-b", "description": "American R&B singer and songwriter", "popularity_score": 86},
    {"name": "Ari Lennox", "genre": "r-and-b", "description": "American R&B singer", "popularity_score": 80},
    {"name": "Lucky Daye", "genre": "r-and-b", "description": "American R&B singer and songwriter", "popularity_score": 82},
    {"name": "Daniel Caesar", "genre": "r-and-b", "description": "Canadian R&B singer and guitarist", "popularity_score": 84},
    {"name": "Giveon", "genre": "r-and-b", "description": "American R&B singer", "popularity_score": 83},
    {"name": "Brent Faiyaz", "genre": "r-and-b", "description": "American R&B singer and producer", "popularity_score": 84},
    {"name": "Steve Lacy", "genre": "r-and-b", "description": "American singer, guitarist, and producer", "popularity_score": 82},
    {"name": "D'Angelo", "genre": "r-and-b", "description": "American neo-soul singer and musician", "popularity_score": 90},
    {"name": "Erykah Badu", "genre": "r-and-b", "description": "American singer and neo-soul queen", "popularity_score": 92},
    {"name": "Lauryn Hill", "genre": "r-and-b", "description": "American singer, rapper, and actress", "popularity_score": 94},
    {"name": "Maxwell", "genre": "r-and-b", "description": "American R&B singer and songwriter", "popularity_score": 88},
    {"name": "Anderson .Paak", "genre": "r-and-b", "description": "American singer, rapper, and drummer", "popularity_score": 87},
    {"name": "Leon Bridges", "genre": "r-and-b", "description": "American soul and R&B singer", "popularity_score": 83},
    {"name": "Snoh Aalegra", "genre": "r-and-b", "description": "Swedish-Iranian R&B singer", "popularity_score": 81},
    {"name": "Jhené Aiko", "genre": "r-and-b", "description": "American R&B singer and songwriter", "popularity_score": 85},
    {"name": "SZA", "genre": "r-and-b", "description": "American R&B singer (also in English)", "popularity_score": 90},
    {"name": "Toni Braxton", "genre": "r-and-b", "description": "American R&B singer", "popularity_score": 88},
    {"name": "Mary J. Blige", "genre": "r-and-b", "description": "American R&B singer, 'Queen of Hip-Hop Soul'", "popularity_score": 91},
    {"name": "Whitney Houston", "genre": "r-and-b", "description": "Legendary American singer and actress", "popularity_score": 99},
    {"name": "Mariah Carey", "genre": "r-and-b", "description": "American singer and songwriter", "popularity_score": 98},
    {"name": "The Weeknd", "genre": "r-and-b", "description": "Canadian R&B singer (also in English)", "popularity_score": 96},
    {"name": "Trey Songz", "genre": "r-and-b", "description": "American R&B singer", "popularity_score": 82},
    {"name": "Chris Brown", "genre": "r-and-b", "description": "American R&B singer and dancer", "popularity_score": 86},
    {"name": "Rihanna", "genre": "r-and-b", "description": "Barbadian R&B and pop singer", "popularity_score": 94},
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


def seed_singers(conn):
    """Insert singers that don't already exist in the database."""
    cur = conn.cursor()

    cur.execute("SELECT name, genre FROM singers")
    existing = {(row[0], row[1]) for row in cur.fetchall()}
    print(f"Existing singer entries in DB: {len(existing)}")

    # Dedup by (name, genre) so multi-genre artists (e.g. Shreya Ghoshal
    # in Hindi + Tamil) get separate entries per genre
    to_insert = [s for s in SINGERS if (s["name"], s["genre"]) not in existing]
    if not to_insert:
        print("No new singers to add. All singers already in database.")
        return

    now = datetime.now(timezone.utc)
    values = []
    for s in to_insert:
        values.append((
            s["name"], s["genre"],
            s.get("description", ""),
            s.get("youtube_channel_id", ""),
            s["popularity_score"],
            True,
            now, now,
        ))

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO singers (name, genre, description, youtube_channel_id,
                             popularity_score, is_active, created_at, updated_at)
        VALUES %s
        """,
        values,
        template="(%s, %s, %s, %s, %s, %s, %s, %s)",
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

    # Count by genre
    genre_counts = Counter(s["genre"] for s in SINGERS)
    print(f"\n📊 Total singers: {len(SINGERS)}")
    print("   By genre:")
    for genre, count in sorted(genre_counts.items()):
        print(f"     {genre}: {count}")
    print("\nDone! Singers seeded successfully.")


if __name__ == "__main__":
    main()
