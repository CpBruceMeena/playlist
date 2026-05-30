# ♿ Accessibility Review Skill

Use this skill to conduct an **accessibility (a11y) review** of the application. This evaluates WCAG compliance, screen reader compatibility, keyboard navigation, and inclusive design.

---

## When to Use

- Before any production release
- When adding new UI components or screens
- After any significant UI redesign
- On a regular cadence for compliance

⏱️ **Estimated time**: 20-40 minutes

## Review Checklist

### 1. Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipping levels)
- [ ] Landmarks used correctly (nav, main, aside, footer, section)
- [ ] Lists use ul/ol/li (not divs styled as lists)
- [ ] Buttons are `<button>` elements (not divs with onClick)
- [ ] Links are `<a>` elements with href
- [ ] Forms use `<form>` with proper fieldset/legend grouping

### 2. Keyboard Navigation
- [ ] All interactive elements are reachable via Tab
- [ ] Tab order follows logical reading order
- [ ] Focus indicators are visible (not just default outline removed)
- [ ] No keyboard traps (can Tab away from all components)
- [ ] Custom components handle keyboard events (Enter, Space, Escape, Arrow keys)
- [ ] Skip-to-content link is available

### 3. Screen Reader Support
- [ ] ARIA labels on icon-only buttons and controls
- [ ] aria-live regions for dynamic content updates (toast messages, loading states)
- [ ] aria-expanded/aria-selected on toggleable elements
- [ ] aria-hidden on decorative elements (icons, spacers)
- [ ] role="alert" on error messages
- [ ] Alt text on images (alt="" for decorative, descriptive for informative)
- [ ] Captions / transcripts for video content

### 4. Color & Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (WCAG AA) for normal text
- [ ] Text contrast ratio ≥ 3:1 for large text (18px+ bold or 24px+)
- [ ] Non-text contrast ≥ 3:1 (icons, borders, focus indicators)
- [ ] Information is not conveyed by color alone (add icons/patterns/text)
- [ ] Focus indicator contrast ≥ 3:1 against adjacent colors

### 5. Forms & Inputs
- [ ] Every input has an associated `<label>` element
- [ ] Required fields are indicated (visually and programmatically with aria-required)
- [ ] Error messages are associated with inputs using aria-describedby
- [ ] Input validation errors are announced to screen readers
- [ ] Autocomplete attributes are used where appropriate

### 6. Motion & Multimedia
- [ ] Respect prefers-reduced-motion (disable animations)
- [ ] No auto-playing video/audio without user consent
- [ ] Pause/stop controls for any auto-playing or looping content
- [ ] Blinking/flashing content doesn't exceed 3 flashes per second (seizure risk)
- [ ] Video players have play/pause, volume, and caption controls

### 7. Responsive & Zoom
- [ ] Content is readable when zoomed to 200% (no horizontal scroll)
- [ ] Text can be resized without breaking layout
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Content reflows in a single column on narrow screens

## Project-Specific Notes (YouTube Smart Playlist Creator)

Key accessibility considerations:
- **Video player**: Custom controls (play, pause, skip, shuffle) must be keyboard accessible with ARIA labels
- **Queue list**: Drag-and-drop reorder must have keyboard alternative (move up/down buttons)
- **Search + filter panel**: Filter dropdown/flyout must be navigable via keyboard (Enter to open, Escape to close, Arrow keys for options)
- **Video thumbnails**: All thumbnails need descriptive alt text (e.g., "Thumbnail for {video title} by {channel}")
- **Loading states**: Announce "Loading playlist..." via aria-live="polite" when fetching/generating
- **Auto-advance**: Notify screen reader users when next video starts playing
- **Error toasts**: Use role="alert" on error/skip messages so they're announced immediately

## Prompt Template

Copy and adapt this:

```
@accessibility-review

Please perform an accessibility review of [PROJECT / FEATURE]. Focus on:

1. **Semantic HTML**: Headings, landmarks, proper element usage
2. **Keyboard navigation**: Tab order, focus indicators, no traps
3. **Screen reader support**: ARIA labels, live regions, alt text
4. **Color & contrast**: WCAG AA compliance, not color-dependent
5. **Forms**: Labels, error associations, validation announcements

Reference files:
- [Component files]
- [Pages/screens]
- [Global styles / theme]
```
