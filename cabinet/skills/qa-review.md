# ✅ QA Review Skill

Use this skill to conduct a **thorough quality assurance review** of a product, feature, or release candidate. This covers functional testing, edge cases, regression testing, and release readiness.

---

## When to Use

- Before releasing a feature to production
- After development is complete and deployed to staging
- For regression testing when making changes
- Before a major milestone demo

⏱️ **Estimated time**: 30-60 minutes (per feature/release)

## Review Checklist

### 1. Functional Testing
- [ ] All user stories / acceptance criteria are met
- [ ] Primary user flow works end-to-end without errors
- [ ] All form inputs validate correctly (required, type, length)
- [ ] Error states are handled gracefully (network failure, timeout, 4xx/5xx)
- [ ] Loading states appear during async operations
- [ ] Empty states display correctly (no data yet, no results found)

### 2. Edge Cases
- [ ] Very long inputs (e.g., 1000+ character search query)
- [ ] Special characters (Unicode, emoji, HTML tags in input)
- [ ] Rapid repeated clicks on buttons (debouncing)
- [ ] Browser back/forward navigation
- [ ] Page refresh during mid-operation
- [ ] Very large datasets (50+ playlist items, scrolling)
- [ ] Zero results from API
- [ ] API timeout / throttling response

### 3. Cross-Browser Testing
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Edge (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Mobile Safari (iOS)
- [ ] Chrome on Android
- [ ] YouTube IFrame Player autoplay policy tested across all browsers (Chrome blocks autoplay without user gesture, Safari requires specific attributes)
- [ ] Mobile: YouTube player behaves correctly (no fullscreen takeover, proper aspect ratio)

### 4. Regression Testing
- [ ] Previously fixed bugs are still fixed
- [ ] New changes didn't break adjacent features
- [ ] Core functionality works after data migrations
- [ ] Third-party integrations still work (YouTube API, OAuth)

### 5. Data Integrity
- [ ] Data saves correctly to database/localStorage
- [ ] Data retrieves and displays correctly on reload
- [ ] No data loss on page refresh during save
- [ ] Duplicate submissions are prevented
- [ ] Data deletion works correctly with confirmation

### 6. Performance Baselines
- [ ] Page loads in under 3 seconds on standard connection
- [ ] API responses handled within reasonable timeouts
- [ ] DOM updates are smooth (no jank during re-renders)
- [ ] Memory usage doesn't grow unbounded over time

### 7. Release Readiness
- [ ] All P0 and P1 bugs are resolved
- [ ] Known issues are documented with workarounds
- [ ] Feature flags / toggles are configured correctly
- [ ] Analytics / tracking events fire correctly
- [ ] Error monitoring (Sentry, etc.) is configured
- [ ] Documentation / changelog is updated

## Project-Specific Notes (YouTube Smart Playlist Creator)

Critical test scenarios:
- **YouTube API quota exhaustion**: Test behavior when daily quota is exceeded (graceful error message)
- **Empty search results**: Test with obscure queries that return 0 videos
- **Filter edge cases**: Duration <4min with exclude "music" — may return 0 results, test empty state
- **Player auto-advance**: Verify next video plays when current ends, including last video in queue
- **Shuffle mode**: Verify no duplicates and all videos play exactly once before repeating
- **OAuth flow**: Test full Google OAuth signup, login, token refresh, and logout
- **localStorage limit**: Guest playlists with 50 videos may hit localStorage ~5MB limit
- **Browser autoplay policies**: Chrome blocks autoplay without user gesture, Safari on iOS requires specific player attributes

## Prompt Template

Copy and adapt this:

```
@qa-review

Please perform a QA review of the [FEATURE / RELEASE]. Focus on:

1. **Functional correctness**: Does it meet acceptance criteria?
2. **Edge cases**: Empty states, errors, boundaries, long inputs
3. **Cross-browser compatibility**: Test in Chrome, Firefox, Safari, Edge
4. **Data integrity**: Save/load/delete/refresh behavior
5. **Release readiness**: Bug status, known issues, monitoring

Reference files:
- [Staging URL]
- [Test cases / spec]
- [Acceptance criteria]
```
