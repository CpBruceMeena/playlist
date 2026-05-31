# Feature Plan: Multi-Singer Playlist (M5)

## Dependency Graph

```
Phase 1: Design
└── design-desktop-web → UI specification (singer selector UI, homepage tabs, combined playlist display)
    └── → engineering-manager (Gate 1: Design Review)

Phase 2: Backend Foundation
├── Singer Model & Migration (database/Singer model)
├── Seed Data (curated 100+ singers across genres)
├── GET /api/v1/singers endpoint (list, filter by genre, search)
└── POST /api/v1/generate/multi-singer endpoint (per-singer YouTube search, combine results)
    └── → engineering-manager (Gate 2: Architecture Review)

Phase 3: Frontend Implementation
├── SingerStore (Zustand store for singer state, selected singers, genres)
├── SingerSelector component (searchable multi-select with genre filtering, max 5 constraint)
├── SingerChip (display selected singer with remove)
├── HomePage tabs ("Search" | "Singers") with smooth tab switching
├── GenerateMultiSinger action (calls new API, shows per-singer progress)
├── PlaylistPage updates (show singer attribution per video in queue)
├── Types updates (Singer, MultiSingerRequest/Response types)
└── API client updates (new endpoints)
    └── → engineering-manager (Gate 3: Implementation Review)

Phase 4: Validation
├── qa-frontend — UI/UX testing
├── qa-backend — API testing
├── security-engineer — Security review
├── bug-hunter — Deep testing
    └── → engineering-manager (Gate 4: QA & Security Review)

Phase 5: Deployment
└── Commit, push, deploy
    └── → engineering-manager (Gate 5: Pre-Deployment Final Review)
```

## Skill Assignments

| Skill | Role | Deliverable |
|-------|------|-------------|
| `design-desktop-web` | Desktop UI design | UI spec with singer selector, tabs, combined display |
| `engineering-backend` | Backend implementation | Singer model, API endpoints, seed script |
| `engineering-database` | Database schema | Singer table migration, GORM model |
| `engineering-frontend` | Frontend implementation | SingerStore, components, page updates |
| `qa-frontend` | Frontend testing | UI component testing |
| `qa-backend` | Backend testing | API endpoint testing |
| `security-engineer` | Security review | API security audit |
| `bug-hunter` | Deep testing | Adversarial testing |
| `engineering-manager` | Technical oversight | Architecture review gates |

## Timeline

| Phase | Duration | Skills Required |
|-------|----------|-----------------|
| Design | 1 day | design-desktop-web |
| Backend Foundation | 1 day | engineering-database, engineering-backend |
| Frontend Implementation | 1.5 days | engineering-frontend |
| Validation | 0.5 days | qa-frontend, qa-backend, security-engineer, bug-hunter |
| Deployment | 0.5 days | engineering-backend, engineering-frontend |

## Data Model

### Singers Table
```sql
CREATE TABLE singers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,  -- 'punjabi', 'haryanvi', 'hindi', 'old-hindi', 'english'
    thumbnail_url VARCHAR(500),
    youtube_channel_id VARCHAR(100),
    description TEXT,
    popularity_score INT DEFAULT 0,  -- for ordering
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_singers_genre ON singers(genre);
CREATE INDEX idx_singers_name ON singers(name);
```

### Seed Data (curated, 100+ singers)
- **Punjabi**: Diljit Dosanjh, AP Dhillon, Sidhu Moose Wala, Karan Aujla, Gurdas Maan, etc.
- **Haryanvi**: Sachin Chaudhary, Desi King, Amit Saini Rohtakiya, etc.
- **Hindi (Modern)**: Arijit Singh, Neha Kakkar, Badshah, Divya Kumar, Shreya Ghoshal, etc.
- **Old Hindi**: Kishore Kumar, Lata Mangeshkar, Mohammed Rafi, Mukesh, etc.
- **English**: Taylor Swift, Ed Sheeran, Drake, The Weeknd, Billie Eilish, etc.

### API Contracts

#### GET /api/v1/singers?genre=punjabi&search=diljit
```json
{
  "data": {
    "singers": [
      {
        "id": "uuid",
        "name": "Diljit Dosanjh",
        "genre": "punjabi",
        "thumbnailUrl": "...",
        "youtubeChannelId": "...",
        "popularityScore": 95
      }
    ],
    "genres": ["punjabi", "haryanvi", "hindi", "old-hindi", "english"]
  }
}
```

#### POST /api/v1/generate/multi-singer
```json
{
  "singerIds": ["uuid1", "uuid2", "uuid3"],
  "resultsPerSinger": 5,
  "filters": {
    "durationMin": null,
    "durationMax": null,
    "videoTypes": ["music"],
    "safeSearch": true
  }
}
```

#### Response
```json
{
  "data": {
    "videos": [
      {
        "id": "youtubeId",
        "title": "...",
        "singerId": "uuid1",
        "singerName": "Diljit Dosanjh",
        "channelTitle": "...",
        ...
      }
    ],
    "quotaUsed": 500,
    "perSingerResults": {
      "uuid1": 5,
      "uuid2": 5,
      "uuid3": 5
    }
  }
}
```

## Frontend Architecture

### New Store: `useSingerStore`
```typescript
interface SingerState {
  singers: Singer[];
  selectedSingers: Singer[]; // max 5
  genres: string[];
  selectedGenre: string | null;
  searchQuery: string;
  resultsPerSinger: number; // 5, 10, or 15
  
  // Actions
  fetchSingers: () => Promise<void>;
  filterByGenre: (genre: string | null) => void;
  searchSingers: (query: string) => void;
  toggleSinger: (singer: Singer) => void; // enforce max 5
  clearSelection: () => void;
  setResultsPerSinger: (count: number) => void;
}
```

### New API: `generateMultiSinger`
```typescript
async function generateMultiSinger(
  singerIds: string[],
  resultsPerSinger: number,
  filters: FilterCriteria
): Promise<GenerateResponse>
```

### Modified Files
- `frontend/types/src/index.ts` — Add Singer, MultiSingerRequest/Response types
- `frontend/src/stores/` — New singerStore.ts
- `frontend/src/api/generate.ts` — Add generateMultiSinger function  
- `frontend/src/api/client.ts` — Add new endpoints
- `frontend/src/pages/HomePage.tsx` — Add tab switching (Search | Singers)
- `frontend/src/components/search/SingerSelector.tsx` — New component
- `frontend/src/components/player/QueueItem.tsx` — Show singer attribution
- `frontend/src/components/search/FilterPanel.tsx` — Add results-per-singer for singer mode
- `frontend/src/App.tsx` — No routing changes needed

### New Components
- `frontend/src/components/search/SingerSelector.tsx` — Search, filter by genre, select singers
- `frontend/src/components/search/SingerChip.tsx` — Removable singer chip with thumbnail
- `frontend/src/components/search/GenreTabs.tsx` — Genre filter tabs

### Backend Modified Files
- `backend/structs/models.go` — Add Singer model
- `backend/structs/requests.go` — Add MultiSingerRequest/Response
- `backend/handlers/generate.go` — Add HandleMultiSinger method
- `backend/handlers/singers.go` — New handler for singer CRUD
- `backend/routes/routes.go` — Add new routes
- `backend/main.go` — Add Singer auto-migrate, seed data
- `backend/services/seed_singers.go` — Seed data file (curated list)
