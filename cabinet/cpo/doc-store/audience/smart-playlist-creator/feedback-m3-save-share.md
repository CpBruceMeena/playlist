# 🎭 Customer Feedback: M3 — Save & Share (LocalStorage)

**Product**: YouTube Smart Playlist Creator v1.0
**Feature**: M3 — LocalStorage Save/Share
**Date**: May 31, 2026

---

## 👤 Priya (Pragmatic Music Fan) — Score: 8.5/10

**Scenario:** Save a generated playlist and load it later

### What worked
- "Save button was right in the header where I expected it. One click, type a name, done."
- "Toast confirmation was quick and non-intrusive — I didn't have to wait for it."
- "Loading was instant — clicked Load and boom, I was back in my playlist."
- "Video count in the card was useful — I could tell at a glance which playlist was which."

### Frustrations
- "I wish I could rename a saved playlist without saving a new one."
- "Would be nice to see a thumbnail preview without hovering."

### Ratings
| Metric | Score | Notes |
|--------|-------|-------|
| Discoverability | 9/10 | Save button obvious in header |
| Learnability | 10/10 | Type name, click save — done |
| Efficiency | 8/10 | Name prompt is one extra step but fine |
| Error recovery | 9/10 | Delete has confirmation, easy undo |
| Satisfaction | 8/10 | Clean, fast, does what I need |

---

## 👤 James (Skeptical Casual Listener) — Score: 8.0/10

**Scenario:** Come back later, find saved playlist, play it, clean up

### What worked
- "The My Playlists link was in the header — I could find it without thinking."
- "Delete was right there next to Load. I didn't have to go searching for it."
- "Loading the playlist was seamless — it just worked."
- "The empty state when all are deleted was friendly, not punishing."

### Frustrations
- "I accidentally saved with the default name and then couldn't rename it."
- "I was worried deleting would ask for confirmation — but it just deleted immediately. That made me nervous."

### Ratings
| Metric | Score | Notes |
|--------|-------|-------|
| Discoverability | 8/10 | Header link obvious |
| Learnability | 9/10 | Very straightforward |
| Efficiency | 7/10 | Default name was confusing |
| Error recovery | 7/10 | Delete is immediate — no confirmation dialog |
| Satisfaction | 8/10 | Felt safe and guided |

---

## 👤 Maya (Power Curator) — Score: 6.5/10

**Scenario:** Manage multiple saved playlists, organize, export

### What worked
- "Saving and loading is fast and reliable."
- "The video count in the card helps me distinguish playlists."
- "Thumbnail preview is a nice touch for visual recognition."

### Frustrations
- **Major:** "No rename — I have to save a new playlist and delete the old one."
- **Major:** "No bulk operations. I can't select multiple and delete them."
- **Medium:** "No export — I'd love a CSV or JSON dump of video IDs."
- **Medium:** "Can't reorder playlists on the My Playlists page."
- **Minor:** "No search within my saved playlists."

### Ratings
| Metric | Score | Notes |
|--------|-------|-------|
| Discoverability | 7/10 | Save is easy, but missing power features |
| Learnability | 8/10 | Basic flow obvious |
| Efficiency | 5/10 | Manual per-playlist management is slow at scale |
| Error recovery | 6/10 | Can't undo delete except re-saving |
| Satisfaction | 6/10 | Works but feels incomplete for power use |

---

## 📊 Aggregate Scores

| Persona | Score | Verdict |
|---------|-------|---------|
| Priya (Pragmatic) | 8.5/10 | ✅ "Does exactly what I need" |
| James (Skeptical) | 8.0/10 | ✅ "Simple and not intimidating" |
| Maya (Power) | 6.5/10 | ⚠️ "Great start, needs power tools" |
| **Overall** | **7.7/10** | **✅ UAT PASS** |

## 🎯 Actionable Findings

### P1 — Should fix next sprint

1. **Rename capability** — Add edit/rename to saved playlists. Currently only save-as-new + delete-old works. Users expect to click a name and edit it inline.
2. **Delete confirmation** — James was nervous about instant deletion. Add a lightweight confirmation or toast with undo option.
3. **Default name UX** — Pre-fill the save dialog with a better default (e.g., derived from search query like "Chill Lofi Mix" instead of "My Playlist").

### P2 — Would meaningfully improve UX

4. **Thumbnail preview in card** — Priya wanted to see the thumbnail without hovering. Show the first video's thumbnail statically.
5. **Playlist search/filter** — With 50 max playlists, search becomes useful quickly.

### P3 — Nice-to-have (future)

6. **Bulk delete** — Select multiple playlists and delete at once
7. **CSV/JSON export** — Export video IDs for use in other tools
8. **Reorder playlists** — Drag to reorder on My Playlists page

## ✅ UAT Acceptance Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Save with custom name | ✅ Pass | Works with Enter to confirm |
| View saved playlists | ✅ Pass | My Playlists page shows list with metadata |
| Load saved playlist | ✅ Pass | Loads into player immediately |
| Delete individual playlist | ✅ Pass | Removes from list with toast |
| Toast confirmations | ✅ Pass | On save, load, and delete |
| Data persists across sessions | ✅ Pass | localStorage persists in browser |
| Zero console errors | ✅ Pass | Only benign form field warning |
| All 3 personas completed | ✅ Pass | Priya 8.5, James 8.0, Maya 6.5 |
