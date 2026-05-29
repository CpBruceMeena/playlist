# 🏗️ Technical Architecture Review Skill

Use this skill to conduct a **technical architecture review** of the system design, codebase structure, and implementation approach. This evaluates scalability, maintainability, tech stack choices, and system design decisions.

---

## When to Use

- During design phase before coding begins
- After a major refactor or restructuring
- When evaluating new tech stack decisions
- Before merging a large architectural change

⏱️ **Estimated time**: 20-45 minutes

## Review Checklist

### 1. System Design
- [ ] Architecture is well-documented (diagrams, ADRs)
- [ ] Separation of concerns is respected (UI / business logic / data)
- [ ] Component/screen hierarchy makes sense
- [ ] State management approach is appropriate for the scale
- [ ] Data flow is unidirectional and predictable
- [ ] API design follows RESTful or other consistent conventions
- [ ] Error handling strategy is consistent across layers

### 2. Scalability
- [ ] Can the system handle 10x the expected load?
- [ ] Database queries are optimized (N+1 queries avoided)
- [ ] Caching strategy is in place for expensive operations
- [ ] API rate limiting and throttling are considered
- [ ] Static assets are optimized and served via CDN
- [ ] Horizontal scaling is possible without rewrites

### 3. Maintainability
- [ ] Code is modular with clear boundaries
- [ ] Naming conventions are consistent
- [ ] Functions/classes have single responsibility
- [ ] Tests exist for critical paths
- [ ] Dead code is removed, not commented out
- [ ] Configuration is externalized (env vars, config files)
- [ ] Logging is useful and not excessive

### 4. Tech Stack
- [ ] Framework choice is appropriate for the problem
- [ ] Libraries are actively maintained and well-adopted
- [ ] No unnecessary dependencies (keep bundle size small)
- [ ] Build tooling is configured correctly
- [ ] Type checking / linting is enforced
- [ ] Language version is current and supported

### 5. Data Architecture
- [ ] Data model matches the domain model
- [ ] Database schema is normalized appropriately
- [ ] Migrations are version-controlled and reversible
- [ ] Data validation happens at the boundary (not just UI)
- [ ] Caching invalidation strategy is defined
- [ ] Data retention / cleanup policy exists

### 6. API Design
- [ ] Endpoints are versioned (e.g., /api/v1/...)
- [ ] Request/response schemas are consistent
- [ ] Pagination is implemented for list endpoints
- [ ] Authentication/authorization is enforced
- [ ] Error responses follow a consistent format
- [ ] API documentation is generated/updated

## Project-Specific Notes (YouTube Smart Playlist Creator)

Architecture considerations:
- **Frontend**: React SPA with YouTube IFrame Player API integration
- **Backend**: Node.js/Express API server handling YouTube Data API v3 calls (proxy pattern to keep API key server-side)
- **Auth**: JWT-based session management + Google OAuth for user accounts
- **Database**: PostgreSQL or MongoDB for user accounts, saved playlists
- **Client-side storage**: localStorage for guest mode playlists
- **API design**: `/api/generate` (fetch + filter), `/api/playlists` (CRUD), all behind auth middleware
- **State management**: React context or Zustand for player state, playlist queue, auth state

## Prompt Template

Copy and adapt this:

```
@technical-architecture-review

Please perform a technical architecture review of [SYSTEM / FEATURE]. Focus on:

1. **System design**: Architecture, component boundaries, data flow
2. **Scalability**: Can this handle growth? Where are the bottlenecks?
3. **Maintainability**: Is the code modular? Will it be easy to extend?
4. **Tech stack**: Are the right tools being used? Any unnecessary dependencies?
5. **Data architecture**: Data model, storage, caching, validation

Reference files:
- [Architecture diagrams]
- [Source code directory structure]
- [Schema definitions]
- [API specs]
```
