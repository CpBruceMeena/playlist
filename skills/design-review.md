# 🎨 Design Review Skill

Use this skill to conduct a **comprehensive design and UX review** of a product, feature, or UI prototype. This evaluates visual design, user experience, interaction patterns, and overall polish.

---

## When to Use

- After UI mockups or prototypes are ready
- Before development begins on a new feature
- During implementation to catch design drift
- Before QA or release

⏱️ **Estimated time**: 20-40 minutes

## Review Checklist

### 1. Visual Design
- [ ] Consistent color palette (primary, secondary, accent, neutral)
- [ ] Consistent typography (font sizes, weights, line heights)
- [ ] Proper spacing and alignment (8px grid or similar system)
- [ ] Visual hierarchy — is the most important thing most prominent?
- [ ] Icons and illustrations feel cohesive (same style/weight)
- [ ] No visual clutter — sufficient whitespace
- [ ] Dark mode / theme support (if applicable)

### 2. Interaction & Motion
- [ ] Hover states exist for all clickable elements
- [ ] Loading states / spinners for async operations
- [ ] Smooth transitions between views/states
- [ ] No jarring layout shifts (CLS < 0.1)
- [ ] Purposeful animations (not just decorative)
- [ ] Drag-and-drop feedback (for reorderable lists)

### 3. UX Flow
- [ ] Fewest possible steps to accomplish primary task
- [ ] Clear affordances — can users tell what's clickable?
- [ ] Undo / redo for destructive actions
- [ ] Confirmation dialogs for irreversible actions
- [ ] Keyboard navigation support (Tab order, Enter/Space)
- [ ] Escape key closes modals/dropdowns
- [ ] Back button works as expected (browser navigation)

### 4. Layout & Responsiveness
- [ ] Works on desktop (1920+), tablet (768), and mobile (375)
- [ ] No horizontal scroll on any breakpoint
- [ ] Touch targets at least 44x44px (mobile)
- [ ] Content reflows properly, not just scales down
- [ ] Sidebar/panel collapses gracefully on smaller screens

### 5. Content & Copy
- [ ] Consistent tone and voice throughout
- [ ] No placeholder text (lorem ipsum) in production
- [ ] Error messages are helpful, not technical
- [ ] Empty states have illustration + helpful message + CTA
- [ ] Button labels are action-oriented ("Save Playlist" not "Submit")

### 6. Accessibility (Basic)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Alt text on all meaningful images
- [ ] Focus indicators visible on all interactive elements
- [ ] Form inputs have associated labels
- [ ] Not relying solely on color to convey information

## Project-Specific Notes (YouTube Smart Playlist Creator)

Key UI elements to review:
- **Search bar + Filter panel**: Dropdown/flyout for duration, video type, tags, upload date, view count
- **Playlist results view**: Thumbnails, titles, durations, channel names in a scrollable list
- **Video player**: Embedded YouTube IFrame Player with custom controls (shuffle, repeat, skip, queue)
- **Up-next queue**: Drag-and-drop reorderable list showing upcoming videos
- **My Playlists page**: Grid of saved playlists for logged-in users
- **Empty states**: No results, API quota exceeded, unavailable video skipped
- **Responsive layout**: Player + queue side-by-side on desktop, stacked on mobile

## Prompt Template

Copy and adapt this:

```
@design-review

Please perform a design review of the [FEATURE/SCREEN]. Focus on:

1. **Visual polish**: Color, typography, spacing, hierarchy
2. **UX flow**: Task completion, navigation, feedback
3. **Responsiveness**: How it adapts across screen sizes
4. **Interaction quality**: Hover states, transitions, animations
5. **Accessibility**: Contrast, keyboard nav, screen reader support

Reference files:
- [UI mockup/prototype link]
- [Component files]
- [Design system tokens]
```
