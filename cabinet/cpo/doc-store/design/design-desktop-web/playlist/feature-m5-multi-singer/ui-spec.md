# UI Specification: Multi-Singer Playlist (M5)
**Design Platform:** Desktop Web
**Layout Pattern:** Top Nav + Content (existing)
**Max Content Width:** 1200px (existing)

---

## 1. Homepage Tab Layout

The existing homepage hero + search area gets a **tab bar** below the hero text/pill that switches between two modes:

```
┌─────────────────────────────────────────────────────────┐
│                    🎵 AI-Powered YouTube Playlists        │
│                                                          │
│   [Search]    [Singers]        ← Tab bar, rounded pills │
│   ────────    ─────────                                  │
│                                                          │
│   (Active tab content)                                    │
└─────────────────────────────────────────────────────────┘
```

### Tab Bar Specification
- **Position**: Below the hero description text, above the active content area
- **Style**: Two pill-shaped tabs side by side
- **Active tab**: Filled background (`bg-blue-600/20` + `text-blue-300` + `ring-1 ring-blue-500/40`)
- **Inactive tab**: Subtle background (`bg-neutral-800` + `text-neutral-400`)
- **Icons**: Search tab gets search icon, Singers tab gets microphone/music icon
- **Transition**: Smooth fade cross-fade (200ms) when switching between tabs
- **Query sync**: Switching tabs does NOT reset the other tab's state

### Tab Behavior
| Action | Result |
|--------|--------|
| Click "Search" tab | Search content visible, Singer content hidden (state preserved) |
| Click "Singers" tab | Singer content visible, Search content hidden (state preserved) |
| Both tabs | Can have independent state; Generate button works for whichever tab is active |

---

## 2. Singer Tab Content

When "Singers" tab is active:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  🔍 Search singers...                     [🎤 Genre ▾]│    │  ← Search + Genre filter row
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │  ← Genre quick filters
│  │  All     │ │ Punjabi  │ │ Haryanvi │ │ Hindi    │        │     (horizontal scrollable)
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤        │
│  │ Old Hindi│ │ English  │  ...                             │
│  └──────────┘                                               │
│                                                              │
│  ─── Selected Singers ─────────────────────────────────────  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │  ← Selected singer chips
│  │ [img] AP │ │ [img] Ar │ │ [img] Ta │      + Add more    │     (max 5, shown as chips
│  │  Dhillon │ │ ijit Sin │ │ ylor ... │                    │      with thumbnail + name)
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                              │
│  ─── Results (8 per singer) ──────────────────────────────  │
│  [▸ 5 per singer]  [▸ 10 per singer]  [▸ 15 per singer]   │  ← Results per singer selector
│                                                              │
│  ─── Suggested Singers ───────────────────────────────────  │
│  ┌──────┐ ┌──────┐ ┌──────┐                                │  ← Singer grid with thumbnails
│  │[img] │ │[img] │ │[img] │                                │     Click to add to selection
│  │ Name │ │ Name │ │ Name │                                │
│  │ Genre│ │ Genre│ │ Genre│                                │
│  │ +Add  │ │ +Add  │ │ +Add  │                              │
│  └──────┘ └──────┘ └──────┘                                │
│                                                              │
│                               [🎵 Generate Combined Playlist]│  ← Primary CTA (disabled if < 2)
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Search Bar
- **Placeholder**: "Search singers... "
- **Behavior**: Filters the singer grid as user types (client-side filtering)
- **Clear button**: Shows when query is active
- **Debounce**: 300ms debounce on input
- **Keyboard**: `/` to focus, `Escape` to blur

### 2.2 Genre Filter Row
- **Horizontal scrollable row** of pill-shaped genre buttons
- **Genres**: All, Punjabi, Haryanvi, Hindi, Old Hindi, English
- **Active genre**: Filled bg + blue text (same as video type chips in FilterPanel)
- **Inactive genre**: Neutral bg
- **Transition**: Smooth slide (150ms)
- **Behavior**: Selecting a genre filters the singer grid below; "All" shows all singers

### 2.3 Selected Singers Row
- **Label**: "Selected Singers" with count badge (e.g., "3/5")
- **Layout**: Horizontal flexbox with wrap
- **Singer Chips**: Each chip shows:
  - Small thumbnail (24×24, rounded-full)
  - Singer name
  - "×" remove button
- **Max constraint**: When 5 selected, all unselected singers show "Max 5" state
- **Animation**: Fade/slide in when added (200ms), slide out when removed
- **Empty state**: "Select up to 5 singers to get started" in muted text

### 2.4 Results Per Singer Selector
- **Layout**: Three inline pill buttons below selected singers
- **Options**: "5 per singer", "10 per singer", "15 per singer"
- **Default**: "10 per singer"
- **Active state**: Blue filled pill (like active genre chip)
- **Visual feedback**: Shows total estimate (e.g., "~30 videos total" for 3×10)

### 2.5 Singer Grid (Suggested Singers)
- **Layout**: Responsive grid, `grid-cols-3 sm:grid-cols-4 lg:grid-cols-5`
- **Cards**: Each singer card contains:
  - **Thumbnail**: 80×80 rounded image (or placeholder gradient with initial)
  - **Name**: Bold, white text, truncate if long
  - **Genre**: Subtitle, muted, small text
  - **Add button**: "+" button (secondary style)
- **States**:
  - **Default**: Show singer thumbnail + name + genre + "+" button
  - **Selected**: Card shows checkmark overlay, "+Add" becomes "✓ Selected" with disabled state
  - **At max**: Unselected singers show "Max" badge, "+Add" disabled with tooltip "Max 5 singers"
  - **No results**: "No singers found matching '{query}'" with suggestion to try different genre
  - **Loading**: 6 skeleton cards with shimmer animation
- **Hover state**: Card subtle elevation change, "+Add" button becomes slightly brighter
- **Scroll**: Grid occupies available height, internal scroll if needed

### 2.6 Generate Button
- **Label**: "Generate Combined Playlist"
- **Icon**: Music note / play icon
- **Disabled**: When fewer than 2 singers selected
- **Loading state**: Shows spinner + "Searching for {singer 1}, {singer 2}..."
- **Disabled tooltip**: "Select at least 2 singers to create a combined playlist"
- **Position**: Below singer grid, full-width button

---

## 3. Combined Playlist Display

When playlist is generated from multi-singer, the playlist page shows singer attribution:

### 3.1 Queue Items
Each video in the queue shows its singer with a small colored badge:

```
┌──────────────────────────────────────────────────┐
│ ▶  [img]  Song Title                          │
│           Artist Name           [🎤 Singer Name] │  ← Singer badge
│           2.4M views · 4:23                   │
└──────────────────────────────────────────────────┘
```

- **Singer Badge**: Small chip (`rounded-full`, `bg-blue-600/20`, `text-blue-300`, `text-xs`)
- **Position**: Right-aligned in the video row, next to duration
- **Icon**: Mic icon before singer name

### 3.2 Queue Header
Updated to show "Combined Playlist" and list contributing singers:

```
┌──────────────────────────────────────────────────┐
│ 🎵 Queue                         15 videos       │
│ Combined from: Diljit · AP Dhillon · Arijit     │  ← Clickable singer names
│ [🔀 Shuffle] [🔁 Repeat]                        │
└──────────────────────────────────────────────────┘
```

- **Collaborators line**: "Combined from: Singer1 · Singer2 · Singer3"
- **Clickable names**: Optional — could filter queue by singer (stretch goal)
- **Show on playlist page**: Only when videos have singer attribution

### 3.3 Player Section
No changes to the YouTube player itself. The current video's singer name appears in `channelTitle` naturally (since we're searching for the singer's songs).

---

## 4. Filter Integration

When "Singers" tab is active, the existing FilterPanel should:
- Default `videoTypes` to `["music"]` (since singers = music)
- Show a note: "Filters apply to all singers"
- Otherwise function identically (duration, keywords, upload date, etc.)

---

## 5. States Matrix

### Tab States
| State | Search Tab | Singers Tab |
|-------|-----------|-------------|
| **Initial** | Search input + suggestions | Singer search + genre filter + grid of all singers |
| **Active** | Input filled, filters active | Singers selected, results per singer set |
| **Loading** | Generation spinner | Per-singer search progress |
| **Done** | Playlist page with queue | Playlist page with singer-attributed queue |

### Singer Selector States

| State | Visual | Behavior |
|-------|--------|----------|
| **Empty (no selection)** | "Select up to 5 singers to get started" | Genre filter active, grid shows all singers |
| **Some selected (1-4)** | Selected singers row visible + count badge | +Add button still shows on unselected |
| **Max selected (5)** | "5/5" badge, max state on remaining cards | Clicking unselected shows toast "You can select up to 5 singers" |
| **Removing** | Slide-out animation, grid card reverts from ✓ to + | Immediately available to re-add |
| **No results** | "No singers found" | Suggests trying different genre or search query |
| **Loading singers** | Skeleton cards | Shimmer animation on grid |

### Combined Playlist Generation States

| State | UI | Detail |
|-------|-----|--------|
| **Pre-generation** | Generate button enabled (≥2 singers) | — |
| **Generating** | Button shows spinner + "Searching..." | Progress shown per singer via toasts or inline status |
| **Partial success** | Some singers returned results, others empty | Toast: "No results found for [singer names]" |
| **All empty** | Error state | "No videos found for any selected singer. Try different singers or adjust filters." |
| **Success** | Navigate to playlist page | Singer badges on queue items |
| **Error** | ErrorState component | Retry button available |

---

## 6. Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `/` | Homepage (Singer tab active) | Focus singer search |
| `Tab` | Singer search | Move to genre filters → singer grid → generate button |
| `↓` | Singer search with results | Move focus to first singer card |
| `Enter` | Singer card focused | Add/remove singer from selection |
| `Backspace` | Singer search empty | Remove last selected singer |

---

## 7. Responsive Behavior

### Desktop (≥1024px)
- Full grid layout as specified above
- Singer grid: 5 columns

### Tablet (768-1023px)
- Singer grid: 3 columns
- Genre filter row: horizontal scroll with fade edge indicators
- Selected singer row: wraps to 2 rows if needed

### Mobile (<768px)
- Singer grid: 2 columns
- Selected singer row: wraps freely
- Genre filter row: swipeable with gradient fade edges
- Singer chips: smaller thumbnails (20×20)

---

## 8. Micro-interactions

| Interaction | Effect | Duration |
|-------------|--------|----------|
| Add singer | Card briefly scales to 1.02, then chip appears with fade-in slide-up | 200ms |
| Remove singer | Chip slides out (translateX -20px + fade), card reverts | 200ms |
| Tab switch | Active tab pill slides to position, content cross-fades | 250ms |
| Genre filter | Active pill transitions color, grid items fade-switch | 200ms |
| Generate button | Subtle pulse when becoming enabled | 300ms |
| Progress | Per-singer dots animate (expanding dots) | Each 500ms |

---

## 9. Empty / Loading / Error States

### Empty State (No Singers Selected)
```
┌─────────────────────────────────────────────┐
│  🎤 Select singers to create a combined     │
│     playlist from your favorite artists     │
│                                              │
│  Choose up to 5 singers from the grid below │
│  or search for a specific name.              │
│                                              │
│  [Browse Punjabi] [Browse Hindi] [Browse ...]│
└─────────────────────────────────────────────┘
```

### Loading State (Generating)
```
┌─────────────────────────────────────────────┐
│  🔍 Searching: AP Dhillon (5 videos)...     │  ← Animated dots
│  🔍 Searching: Arijit Singh (5 videos)...   │
│  ⏳ Searching: Taylor Swift...              │
│                                              │
│  [⠋ Generating combined playlist...]         │
└─────────────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────────────┐
│  ⚠️ No videos found for:                    │
│  • AP Dhillon — no results (try fewer       │
│    filters)                                 │
│                                              │
│  [Try again]  [Edit singer selection]       │
└─────────────────────────────────────────────┘
```
