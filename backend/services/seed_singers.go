package services

import (
	"log"

	"gorm.io/gorm"

	"playlist-backend/structs"
)

// SeedSingers populates the singers table with curated popular artists
// This is idempotent — only inserts if table is empty
func SeedSingers(db *gorm.DB) error {
	var count int64
	db.Model(&structs.Singer{}).Count(&count)
	if count > 0 {
		log.Printf("Singers table already has %d records, skipping seed", count)
		return nil
	}

	singers := []structs.Singer{
		// ─── Punjabi ──────────────────────────────────────────
		{Name: "Diljit Dosanjh", Genre: "punjabi", Description: "Punjabi singer, songwriter, and actor", YouTubeChannelID: "UCdQ3fZU5OWOl0sOEh6w7zAQ", PopularityScore: 99},
		{Name: "AP Dhillon", Genre: "punjabi", Description: "Punjabi singer, rapper, and record producer", YouTubeChannelID: "UCGLeD6r4LajJq0BvR8OqEAg", PopularityScore: 98},
		{Name: "Sidhu Moose Wala", Genre: "punjabi", Description: "Punjabi singer, rapper, and songwriter", PopularityScore: 97},
		{Name: "Karan Aujla", Genre: "punjabi", Description: "Punjabi singer, rapper, and songwriter", PopularityScore: 96},
		{Name: "Shubh", Genre: "punjabi", Description: "Punjabi singer, global sensation with hip-hop infused sound", PopularityScore: 95},
		{Name: "Arjan Dhillon", Genre: "punjabi", Description: "Punjabi singer and versatile songwriter, known for lyrical depth", PopularityScore: 93},
		{Name: "Gurdas Maan", Genre: "punjabi", Description: "Legendary Punjabi folk and pop singer", PopularityScore: 90},
		{Name: "Guru Randhawa", Genre: "punjabi", Description: "Punjabi pop singer", PopularityScore: 88},
		{Name: "Sharry Mann", Genre: "punjabi", Description: "Punjabi singer and actor", PopularityScore: 85},
		{Name: "Ammy Virk", Genre: "punjabi", Description: "Punjabi singer and actor", PopularityScore: 84},
		{Name: "Nimrat Khaira", Genre: "punjabi", Description: "Punjabi female singer", PopularityScore: 82},
		{Name: "Amrit Maan", Genre: "punjabi", Description: "Punjabi singer and songwriter", PopularityScore: 79},
		{Name: "Jasmine Sandlas", Genre: "punjabi", Description: "Punjabi singer and songwriter", PopularityScore: 78},
		{Name: "Garry Sandhu", Genre: "punjabi", Description: "Punjabi singer", PopularityScore: 77},
		{Name: "Satinder Sartaaj", Genre: "punjabi", Description: "Punjabi singer, poet, and songwriter", PopularityScore: 76},
		{Name: "Karan Randhawa", Genre: "punjabi", Description: "Punjabi singer", PopularityScore: 75},
		{Name: "Mankirt Aujla", Genre: "punjabi", Description: "Punjabi singer, known for chart-topping hits", PopularityScore: 74},
		{Name: "Prem Dhillon", Genre: "punjabi", Description: "Punjabi singer with street-style narrative", PopularityScore: 73},
		{Name: "Gurlej Akhtar", Genre: "punjabi", Description: "Punjabi singer", PopularityScore: 72},
		{Name: "Ranjit Bawa", Genre: "punjabi", Description: "Punjabi singer", PopularityScore: 71},
		{Name: "Tarsem Jassar", Genre: "punjabi", Description: "Punjabi singer and actor", PopularityScore: 70},
		{Name: "Fateh", Genre: "punjabi", Description: "Punjabi rapper", PopularityScore: 69},
		{Name: "Parmish Verma", Genre: "punjabi", Description: "Punjabi singer, rapper, and director", PopularityScore: 68},
		{Name: "Mickey Singh", Genre: "punjabi", Description: "Punjabi-American singer", PopularityScore: 67},
		{Name: "Sunanda Sharma", Genre: "punjabi", Description: "Punjabi female singer", PopularityScore: 65},
		{Name: "Cheema Y", Genre: "punjabi", Description: "Punjabi rapper, breakout star with distinct style", PopularityScore: 87},
		{Name: "Navaan Sandhu", Genre: "punjabi", Description: "Punjabi singer and rapper, rising star in pop-rap", PopularityScore: 82},
		{Name: "Kirat Gill", Genre: "punjabi", Description: "Punjabi singer", PopularityScore: 80},
		{Name: "Harmanjeet Singh", Genre: "punjabi", Description: "Punjabi folk singer", PopularityScore: 60},
		{Name: "Gurlez Akhtar", Genre: "punjabi", Description: "Punjabi singer, known for powerful vocals", PopularityScore: 63},

		// ─── Haryanvi ─────────────────────────────────────────
		{Name: "Sachin Chaudhary", Genre: "haryanvi", Description: "Haryanvi singer known for folk and pop songs", PopularityScore: 88},
		{Name: "Masoom Sharma", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 87},
		{Name: "Amit Saini Rohtakiya", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 86},
		{Name: "Desi King (Fazilpuria)", Genre: "haryanvi", Description: "Haryanvi and Punjabi singer", PopularityScore: 85},
		{Name: "R Maan", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 82},
		{Name: "Khasa Aala Chahar", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 80},
		{Name: "Sumit Goswami", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 78},
		{Name: "Naveen Chaudhary", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 76},
		{Name: "Bintu Pabra", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 75},
		{Name: "Mandeep Choudhary", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 74},
		{Name: "Sahil Sandhu", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 72},
		{Name: "Rajoo Rathi", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 70},
		{Name: "Rohit Sardhana", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 68},
		{Name: "Gulab Sidhu", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 66},
		{Name: "Twinkle Arora", Genre: "haryanvi", Description: "Haryanvi female singer", PopularityScore: 65},
		{Name: "Sunny Sharma", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 64},
		{Name: "Sonu Kadiyan", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 63},
		{Name: "Akanksha Sharma", Genre: "haryanvi", Description: "Haryanvi female singer", PopularityScore: 62},
		{Name: "Monu Ghanghas", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 61},
		{Name: "Manoj Kanaujiya", Genre: "haryanvi", Description: "Haryanvi singer", PopularityScore: 60},
		{Name: "Dhanda Nyoliwala", Genre: "haryanvi", Description: "Haryanvi rapper with urban-inflected style, topping YouTube charts", PopularityScore: 90},
		{Name: "Raj Mawar", Genre: "haryanvi", Description: "Haryanvi singer, consistent hitmaker in high-energy dance tracks", PopularityScore: 84},
		{Name: "Vikram Sarkar", Genre: "haryanvi", Description: "Haryanvi singer, rising presence on trending playlists", PopularityScore: 80},
		{Name: "Renuka Panwar", Genre: "haryanvi", Description: "Haryanvi female singer, primary female vocal force in industry", PopularityScore: 82},
		{Name: "Krishan Chauhan", Genre: "haryanvi", Description: "Haryanvi singer, known for traditional-modern fusion", PopularityScore: 77},
		{Name: "Banjaare (Sumit & Anuj)", Genre: "haryanvi", Description: "Haryanvi duo, reached Billboard India with 'Bairan'", PopularityScore: 79},
		{Name: "Anil Prem Nagariya", Genre: "haryanvi", Description: "Haryanvi singer, consistent hits in YouTube jukeboxes", PopularityScore: 74},
		{Name: "Sapna Choudhary", Genre: "haryanvi", Description: "Popular Haryanvi dancer, singer, and entertainer", PopularityScore: 89},
		{Name: "Ajay Hooda", Genre: "haryanvi", Description: "Haryanvi lyricist, singer, and performer from Rohtak", PopularityScore: 83},
		{Name: "Diler Kharkiya", Genre: "haryanvi", Description: "Haryanvi singer known for highly popular hit songs", PopularityScore: 81},
		{Name: "Gulzaar Chhaniwala", Genre: "haryanvi", Description: "Haryanvi youth icon known for distinct rap style", PopularityScore: 79},
		{Name: "Pranjal Dahiya", Genre: "haryanvi", Description: "Haryanvi actress, model, and dancer in music videos", PopularityScore: 76},
		{Name: "Vikram Singh", Genre: "haryanvi", Description: "Haryanvi singer and performer", PopularityScore: 73},
		{Name: "MC Square", Genre: "haryanvi", Description: "Haryanvi rapper who brought regional music to national platforms", PopularityScore: 71},

		// ─── Hindi (Modern) ───────────────────────────────────
		{Name: "Arijit Singh", Genre: "hindi", Description: "Indian playback singer, most popular of modern era", YouTubeChannelID: "UCKzQExt9Mildif3MZbAG5mg", PopularityScore: 100},
		{Name: "Shreya Ghoshal", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 94},
		{Name: "Neha Kakkar", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 95},
		{Name: "Badshah", Genre: "hindi", Description: "Indian rapper and singer", PopularityScore: 93},
		{Name: "Atif Aslam", Genre: "hindi", Description: "Pakistani playback singer popular in Bollywood", PopularityScore: 92},
		{Name: "Sonu Nigam", Genre: "hindi", Description: "Indian playback singer, versatile vocalist", PopularityScore: 90},
		{Name: "Sunidhi Chauhan", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 89},
		{Name: "Darshan Raval", Genre: "hindi", Description: "Indian singer and songwriter", PopularityScore: 87},
		{Name: "Jubin Nautiyal", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 86},
		{Name: "Alka Yagnik", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 86},
		{Name: "Shankar Mahadevan", Genre: "hindi", Description: "Indian playback singer and composer", PopularityScore: 85},
		{Name: "Kumar Sanu", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 84},
		{Name: "Udit Narayan", Genre: "hindi", Description: "Nepalese-Indian playback singer", PopularityScore: 83},
		{Name: "Vishal Dadlani", Genre: "hindi", Description: "Indian singer and composer", PopularityScore: 82},
		{Name: "B Praak", Genre: "hindi", Description: "Indian singer and music director", PopularityScore: 81},
		{Name: "Mohit Chauhan", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 80},
		{Name: "Sachet Tandon", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 79},
		{Name: "Divya Kumar", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 78},
		{Name: "Vishal Mishra", Genre: "hindi", Description: "Indian singer and composer", PopularityScore: 77},
		{Name: "Papon (Angaraag Mahanta)", Genre: "hindi", Description: "Indian folk and playback singer", PopularityScore: 76},
		{Name: "Amit Trivedi", Genre: "hindi", Description: "Indian music composer and singer", PopularityScore: 75},
		{Name: "Tulsi Kumar", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 74},
		{Name: "Monali Thakur", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 73},
		{Name: "Harshdeep Kaur", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 72},
		{Name: "Neeti Mohan", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 70},
		{Name: "KK", Genre: "hindi", Description: "Indian playback singer, known for soulful romantic vocals", PopularityScore: 91},
		{Name: "Amitabh Bhattacharya", Genre: "hindi", Description: "Indian lyricist and singer", PopularityScore: 68},
		{Name: "Diljit Dosanjh", Genre: "hindi", Description: "Punjabi singer also popular in Bollywood", PopularityScore: 89},
		{Name: "Palak Muchhal", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 71},
		{Name: "Shilpa Rao", Genre: "hindi", Description: "Indian playback singer", PopularityScore: 79},
		{Name: "Ananya Birla", Genre: "hindi", Description: "Indian singer and songwriter", PopularityScore: 63},
		{Name: "Raghav Chaitanya", Genre: "hindi", Description: "Indian playback singer, known for soft vocals", PopularityScore: 69},
		{Name: "Armaan Malik", Genre: "hindi", Description: "Indian playback singer and composer", PopularityScore: 84},
		{Name: "Raftaar", Genre: "hindi", Description: "Indian rapper and singer", PopularityScore: 80},
		{Name: "Dino James", Genre: "hindi", Description: "Indian rapper and singer", PopularityScore: 72},
		{Name: "King", Genre: "hindi", Description: "Indian singer and rapper, known for 'Tu Aake Dekhle'", PopularityScore: 83},
		{Name: "Mellow D", Genre: "hindi", Description: "Indian singer", PopularityScore: 66},

		// ─── Old Hindi ─────────────────────────────────────────
		{Name: "Kishore Kumar", Genre: "old-hindi", Description: "Legendary Indian playback singer and actor", PopularityScore: 100},
		{Name: "Lata Mangeshkar", Genre: "old-hindi", Description: "Legendary Indian playback singer, Nightingale of India", PopularityScore: 100},
		{Name: "Mohammed Rafi", Genre: "old-hindi", Description: "Legendary Indian playback singer", PopularityScore: 98},
		{Name: "Asha Bhosle", Genre: "old-hindi", Description: "Legendary Indian playback singer", PopularityScore: 96},
		{Name: "Mukesh", Genre: "old-hindi", Description: "Legendary Indian playback singer", PopularityScore: 95},
		{Name: "Manna Dey", Genre: "old-hindi", Description: "Indian playback singer", PopularityScore: 90},
		{Name: "Geeta Dutt", Genre: "old-hindi", Description: "Indian playback singer", PopularityScore: 88},
		{Name: "Hemant Kumar", Genre: "old-hindi", Description: "Indian playback singer and composer", PopularityScore: 86},
		{Name: "Talat Mahmood", Genre: "old-hindi", Description: "Indian playback singer", PopularityScore: 85},
		{Name: "Noor Jehan", Genre: "old-hindi", Description: "Indian-Pakistani playback singer", PopularityScore: 84},
		{Name: "Suman Kalyanpur", Genre: "old-hindi", Description: "Indian playback singer", PopularityScore: 82},
		{Name: "Shamshad Begum", Genre: "old-hindi", Description: "Indian playback singer", PopularityScore: 80},
		{Name: "Rafi & Lata (Duets)", Genre: "old-hindi", Description: "Iconic duo of Indian playback singing", PopularityScore: 78},
		{Name: "K L Saigal", Genre: "old-hindi", Description: "Pioneering Indian playback singer and actor", PopularityScore: 75},
		{Name: "C H Atma", Genre: "old-hindi", Description: "Indian playback singer", PopularityScore: 70},

		// ─── English ───────────────────────────────────────────
		{Name: "Taylor Swift", Genre: "english", Description: "American singer-songwriter, pop icon", YouTubeChannelID: "UCqECaJ8GagnnVelICmhV2gA", PopularityScore: 99},
		{Name: "Ed Sheeran", Genre: "english", Description: "English singer-songwriter", YouTubeChannelID: "UC0C-w0YjGpqDXGB8IHb662A", PopularityScore: 98},
		{Name: "Drake", Genre: "english", Description: "Canadian rapper and singer", YouTubeChannelID: "UCByuG6Gx8BTxg_lW7g5kX1A", PopularityScore: 97},
		{Name: "The Weeknd", Genre: "english", Description: "Canadian singer, songwriter, and record producer", PopularityScore: 96},
		{Name: "Billie Eilish", Genre: "english", Description: "American singer-songwriter", YouTubeChannelID: "UCiGm_Eg9mS2IBVmHqbNi5TQ", PopularityScore: 95},
		{Name: "Adele", Genre: "english", Description: "English singer-songwriter", YouTubeChannelID: "UCuV38a2LaLBM_HNQStM8QZg", PopularityScore: 94},
		{Name: "Bruno Mars", Genre: "english", Description: "American singer, songwriter, and record producer", YouTubeChannelID: "UCkLDZSp0CmNdLC00Jh6aTXw", PopularityScore: 93},
		{Name: "Rihanna", Genre: "english", Description: "Barbadian singer and businesswoman", YouTubeChannelID: "UCcgVECVN4OkpYHnh4S4FhHg", PopularityScore: 93},
		{Name: "Dua Lipa", Genre: "english", Description: "English singer and songwriter", YouTubeChannelID: "UCJYwBcPFCf52h6D8XOIj0Dg", PopularityScore: 92},
		{Name: "Ariana Grande", Genre: "english", Description: "American singer and actress", YouTubeChannelID: "UC9CoOnJkqdeHdLfH2p-Hw7g", PopularityScore: 91},
		{Name: "Eminem", Genre: "english", Description: "American rapper and songwriter", YouTubeChannelID: "UCfM3M0-2PMdE3Wv3lF8zT1w", PopularityScore: 91},
		{Name: "Coldplay", Genre: "english", Description: "British rock band", YouTubeChannelID: "UCC7DtnEIf6DYsCaJ4SiTlYg", PopularityScore: 90},
		{Name: "Kendrick Lamar", Genre: "english", Description: "American rapper and songwriter", PopularityScore: 89},
		{Name: "Kanye West", Genre: "english", Description: "American rapper, singer, and record producer", PopularityScore: 88},
		{Name: "Post Malone", Genre: "english", Description: "American rapper and singer", PopularityScore: 87},
		{Name: "Imagine Dragons", Genre: "english", Description: "American pop rock band", YouTubeChannelID: "UCT9zcQNlyht7fRlcjmflRSA", PopularityScore: 87},
		{Name: "Harry Styles", Genre: "english", Description: "English singer and actor", PopularityScore: 86},
		{Name: "Olivia Rodrigo", Genre: "english", Description: "American singer-songwriter", PopularityScore: 85},
		{Name: "Maroon 5", Genre: "english", Description: "American pop rock band", PopularityScore: 85},
		{Name: "Doja Cat", Genre: "english", Description: "American rapper and singer", PopularityScore: 84},
		{Name: "Travis Scott", Genre: "english", Description: "American rapper and record producer", PopularityScore: 83},
		{Name: "OneRepublic", Genre: "english", Description: "American pop rock band", PopularityScore: 82},
		{Name: "SZA", Genre: "english", Description: "American singer-songwriter", PopularityScore: 82},
		{Name: "Lana Del Rey", Genre: "english", Description: "American singer-songwriter", PopularityScore: 80},
		{Name: "Hozier", Genre: "english", Description: "Irish singer-songwriter", PopularityScore: 78},
	}

	// Batch insert
	for _, singer := range singers {
		if err := db.Create(&singer).Error; err != nil {
			log.Printf("Warning: failed to seed singer %s: %v", singer.Name, err)
		}
	}

	log.Printf("Seeded %d singers across %d genres", len(singers), 5)
	return nil
}
