# 💬 M2: Filters & Queue — Customer Feedback

**Product**: YouTube Smart Playlist Creator v1.0
**Feature**: M2 — Filters & Queue
**Date**: May 31, 2026
**Reviewer**: Customer/User Skill

---

## 👤 Persona 1: Priya — Pragmatic Music Fan (28, Software Engineer)

**Overall Sentiment:** Very Positive (8.5/10)

### What I Like
- "Filters are exactly where I'd expect them — feels like every other modern app"
- "Upload Date presets are perfect. I only want recent music."
- "Drag reorder in the queue is buttery smooth. I use this all the time on Spotify."
- "Shuffle button works exactly how I expect — Fisher-Yates done right"
- "Progress bar click-to-seek is instant, no lag"
- "The filter badge showing active count is a nice touch — helps me remember I changed something"

### What Frustrates Me
- "I wish the Generate button had a small indicator showing '3 filters active' without needing to open the panel. I keep forgetting I set filters and wonder why results are different."
- "The queue panel takes up a lot of horizontal space on my laptop. I'd like an option to collapse it or make it narrower."
- "When I drag a video in the queue, it doesn't show a visual drop indicator (like a line where it will land). I have to guess."
- "I wish there was an Undo for queue reordering. Sometimes I drag something and lose track of where it was."

### What's Missing
- "Dark/light mode toggle? Not filters-related, but the app is always dark."
- "Would be nice to have a 'Clear all filters' button in the search bar area, not just inside the panel."

### Would you pay for this?
- "Freemium model yes — free up to 25 results, paid for 50+ and advanced filters like custom date range"

### Recommendation to friend?
- "Absolutely, sent it to my coder friends already — they love lofi too"

---

## 👤 Persona 2: James — Skeptical Casual Listener (45, Teacher)

**Overall Sentiment:** Positive (7.5/10)

### What I Like
- "The filter button is easy to find — big and clearly labeled 'Filters'"
- "Duration presets make sense to me: '1-4 min', '4-10 min'. I don't have to think about seconds."
- "Keyword chips are clear — I can see what I added and click X to remove them"
- "The player controls are standard — play, pause, next — I knew what to do immediately"
- "Progress bar is big enough to click, and it shows the time in a readable format"
- "The queue list shows thumbnails, so I can recognize videos by the picture"

### What Frustrates Me
- "I clicked 'Filters' but nothing happened at first because I didn't realize it was collapsed. Maybe a slight animation or color change would help."
- "I accidentally added 'study' as a keyword when I meant to search for it. The keyword stayed even when I searched something else. That was confusing."
- "The drag handle icon (three lines) is too small. I couldn't figure out how to reorder at first."
- "When I shuffled the queue, I felt lost — I couldn't find my current song anymore"
- "Safe Search is ON by default — noticed because results felt limited. It's good for me but I didn't know it was on."

### What's Missing
- "A simple text: 'Your filters returned no results. Try broadening your search.' when 0 results happen. I got nothing and thought it was broken."
- "Reset button could be more prominent — I scrolled to find it at the bottom of filters"

### Would you pay for this?
- "No. I'd use it if it's free. I'm too casual to pay."

### Recommendation to friend?
- "Maybe my son who's into music. I'd tell him to try it."

---

## 👤 Persona 3: Maya — Power Curator (32, Content Creator / DJ)

**Overall Sentiment:** Positive (8/10)

### What I Like
- "FINALLY someone built Filter Criteria properly. Duration sliders with custom ranges? Yes."
- "Upload Date with actual presets — Past Week, Past Month — this is essential for finding fresh content"
- "Include/Exclude keywords per playlist is a game-changer for themed sets"
- "Min Views filter lets me filter out noise — a must for curating quality content"
- "Shuffle + Repeat in queue header AND player controls — good consistency"
- "The ReorderQueue function handles currentIndex adjustment correctly during drag — impressive attention to detail"
- "ProgressBar with keyboard navigation (arrow keys, Home/End) is great for accessibility"
- "The filter count badge is useful at a glance"

### What Frustrates Me
- "No custom date range picker in the UI! The backend supports it but I can't use it."
- "Max Results dropdown stops at 50. For my workflow, I need 100+ results sometimes."
- "No way to save filter presets. I use the same filter combo (duration 4-10min, last month, min 10K views, include 'instrumental') every time."
- "The drag-and-drop works but has no animation or drop indicator. For serious playlist ordering, I need visual feedback."
- "When I have 50 videos in queue, scrolling is tedious. A 'Jump to Now Playing' button would be nice."
- "Exclude keywords only work on title/description. I wish I could exclude by channel."

### What's Missing
- "Batch operations: Select multiple videos in queue and move/delete them together"
- "Filter presets / saved filter combinations"
- "Ability to save and name the playlist from the playlist page"
- "Keyboard shortcut 'S' for shuffle, 'R' for repeat"
- "Export playlist as URL or share link directly from playlist page (this might be M3)"
- "Sort queue by: title, duration, views, upload date — ascending/descending"

### Would you pay for this?
- "YES. $5/month for unlimited results, custom date ranges, and saved filter presets. $10/month if you add save/load playlists."

### Recommendation to friend?
- "I'm literally showing this to my DJ collective this weekend. This solves a real workflow problem."

---

## Cross-Audience Conflicts

| Feature | Priya | James | Maya |
|---------|-------|-------|------|
| **Drag-and-drop queue** | 9/10 "smooth" | 5/10 "handle too small" | 7/10 "needs drop indicator" |
| **Filter panel (collapsed)** | 8/10 "expected" | 6/10 "didn't realize it toggles" | 9/10 "saves space" |
| **Shuffle** | 9/10 "works great" | 4/10 "lost my song" | 8/10 "good implementation" |
| **0 results handling** | 6/10 "noticed it" | 3/10 "thought it was broken" | 7/10 "expected but wants message" |
| **Keyword system** | 8/10 "clean" | 6/10 "confused about persistence" | 9/10 "essential feature" |

**Key Insight:** The gap between James (Skeptical Casual) and Maya (Power Curator) is widest on **shuffle** and **drag-and-drop**. Maya wants more power, James wants more guidance. The biggest blind spot is **0 results feedback** — only James caught it as a real frustration, but it affects all users.
