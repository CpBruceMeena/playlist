# 🏢 CEO Review Skill

Use this skill to conduct a **CEO-level strategic review** of a product, feature, or PRD before launch. This evaluates business viability, market fit, resource allocation, and overall readiness from an executive perspective.

---

## When to Use

- Before a major product launch or feature release
- After a PRD is drafted but before development begins
- At key milestones (demo, beta, GA)
- When evaluating whether to pivot, continue, or kill a project

⏱️ **Estimated time**: 20-40 minutes

## Review Checklist

### 1. Strategic Alignment
- [ ] Does this align with the company's mission and vision?
- [ ] Does it serve our target market effectively?
- [ ] What is the competitive advantage? Why will users choose us?
- [ ] What is our defensible moat? (data network effects, UX quality, technical advantage, brand)
- [ ] Is this a "must-have" or "nice-to-have"?

### 2. Business Viability
- [ ] What is the revenue model (if any)?
- [ ] What is the estimated development cost vs. projected value?
- [ ] What is the TAM (Total Addressable Market) for this feature?
- [ ] What are the unit economics (API costs, server costs per user)?

### 3. Market Readiness
- [ ] Who are the direct competitors? How are we different/better?
- [ ] Is there clear evidence of user demand (surveys, data, feedback)?
- [ ] What is the GTM (Go-to-Market) strategy?
- [ ] Are there any regulatory or legal risks (e.g., copyright, data privacy)?

### 4. Resource Allocation
- [ ] Do we have the right team/skills to execute this?
- [ ] Is the timeline realistic given current commitments?
- [ ] What are the opportunity costs — what won't we build instead?
- [ ] Are there third-party dependencies that could block us?

### 5. Risk Assessment
- [ ] What are the top 3 things that could go wrong?
- [ ] What is the blast radius if this fails?
- [ ] Do we have a fallback/rollback plan?
- [ ] Are there single points of failure (team, API, vendor)?

### 6. Success Criteria
- [ ] Are the KPIs and success metrics clearly defined?
- [ ] What is the minimum bar for "this is worth continuing"?
- [ ] How will we measure user satisfaction?
- [ ] What is the timeline to revisit if metrics aren't met?

## Project-Specific Notes (YouTube Smart Playlist Creator)

Key strategic considerations:
- **API dependency risk**: Product relies entirely on YouTube Data API v3 — what if terms change, quota pricing increases, or API is deprecated?
- **Monetization path**: No revenue model defined in v1. Will it be free-tier with limits, ads, or premium subscriptions in v2?
- **Competitive landscape**: Spotify playlists, YouTube native playlists, other playlist generators like Playlist Buddy, Songshift
- **Defensibility**: Low technical moat — YouTube API is public. Differentiation is in UX quality, filter depth, and curation algorithms
- **Total market**: All YouTube users who want better playlist management. TAM is large but competition is fragmented
- **API quota costs**: YouTube Data API v3 has daily quota limits (10,000 units/day). Each search = 100 units. Need to estimate cost per user
- **GTM strategy**: How will users find this? Organic search "youtube playlist generator"? Social/viral sharing of playlists?
- **Top 3 risks**: (1) YouTube ToS changes / API deprecation, (2) User acquisition cost vs. zero revenue in v1, (3) API quota scaling with user growth

## Prompt Template

Copy and adapt this:

```
Using the CEO Review checklist from skills/ceo-review.md, perform a strategic review of [PRODUCT/FEATURE]. Focus on:

1. **Strategic Fit**: Does this align with our direction? Should we be building this?
2. **Business Case**: What's the ROI case? Is this worth the investment?
3. **Competitive Moat**: What makes this defensible? Can competitors replicate it easily?
4. **Competitive Landscape**: How does this compare to alternatives?
5. **Risk Analysis**: What are the biggest risks and how should we mitigate them?
6. **Go/No-Go Recommendation**: Give a clear verdict with rationale.

Reference files:
- [PRD link]
- [Competitive analysis]
- [Cost estimates]
```
