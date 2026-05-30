# ⚡ Performance Review Skill

Use this skill to conduct a **performance review** of the application. This evaluates load times, rendering performance, API efficiency, and resource optimization.

---

## When to Use

- Before production launch
- After adding significant new features
- When users report slowness or lag
- Before and after performance optimizations

⏱️ **Estimated time**: 20-40 minutes

## Review Checklist

### 1. Loading Performance
- [ ] Initial page load < 2s on 3G/4G connection
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.5s
- [ ] Bundle size is optimized (code splitting, tree shaking)

### 2. Network & API Efficiency
- [ ] API calls are batched where possible
- [ ] Unnecessary API calls are avoided (debounce search input)
- [ ] API responses are paginated (not returning all data at once)
- [ ] Response caching is implemented (client + server)
- [ ] Data prefetching for likely user actions
- [ ] Request deduplication (same request in-flight not made twice)

### 3. Rendering Performance
- [ ] No unnecessary re-renders (React.memo, useMemo, useCallback where appropriate)
- [ ] Virtual scrolling for long lists (10+ items)
- [ ] Image lazy loading for off-screen images
- [ ] Animations use compositor-only properties (transform, opacity)
- [ ] Debounced/throttled event handlers (scroll, resize, input)
- [ ] No layout thrashing (avoid reading then writing DOM in loops)

### 4. Asset Optimization
- [ ] Images are properly sized and compressed (WebP/AVIF)
- [ ] Fonts are subsetted and loaded with font-display: swap
- [ ] CSS is minified and critical CSS is inlined
- [ ] JavaScript is code-split by route/page
- [ ] Icons use SVGs or icon fonts (not individual PNGs)
- [ ] Preload/preconnect for critical resources

### 5. YouTube API Usage (Specific to This Project)
- [ ] API calls are minimized (cache search results per session)
- [ ] Batch video details requests rather than individual lookups
- [ ] YouTube API quota usage is tracked and optimized
- [ ] Fallback behavior when quota is exceeded
- [ ] Player iframe loads lazily (only when user hits play)

### 6. Memory Management
- [ ] No memory leaks from event listeners (cleaned up on unmount)
- [ ] Large data structures are cleaned up when no longer needed
- [ ] Web workers for heavy processing (if applicable)
- [ ] setInterval/setTimeout are cleared on component unmount
- [ ] Observable/Subscription patterns are unsubscribed

## Project-Specific Notes (YouTube Smart Playlist Creator)

Key performance considerations:
- **YouTube API quota**: Search.list = 100 units, Videos.list = 1 unit each. Target <150 units per generation
- **Cache strategy**: Cache search results per session (avoid re-fetching when user re-generates)
- **Player iframe loading**: Lazy-load YouTube IFrame Player only when user clicks "Play"
- **Image optimization**: YouTube thumbnails are already CDN-hosted — use appropriate `maxresdefault.jpg` vs `mqdefault.jpg` based on viewport
- **Queue with 50 videos**: Use virtual scrolling for the playlist queue if rendering all items
- **Drag-and-drop reorder**: Ensure smooth reordering without layout jank for lists of 25-50 items
- **Bundle size**: YouTube IFrame Player API is loaded externally — don't bundle it

## Prompt Template

Copy and adapt this:

```
@performance-review

Please perform a performance review of [PROJECT / FEATURE]. Focus on:

1. **Load performance**: Bundle size, code splitting, LCP, TTI
2. **API efficiency**: Caching, batching, pagination, quota optimization
3. **Rendering**: Re-renders, virtual scrolling, debouncing
4. **Asset optimization**: Images, fonts, CSS, JavaScript
5. **Memory**: Leaks, cleanup, large data handling

Reference files:
- [Source code entry points]
- [API calls / data fetching code]
- [Component rendering logic]
- [Build configuration]
```
