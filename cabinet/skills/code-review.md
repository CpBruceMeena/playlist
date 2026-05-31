# 💻 Code Review Skill

Use this skill to conduct a **thorough code review** of pull requests, feature implementations, or refactors. This evaluates code quality, correctness, best practices, and maintainability.

**Sourced from industry standards:** [google/eng-practices](https://github.com/google/eng-practices), conventional PR templates, React best practices

---

## When to Use

- Before merging any pull request
- After implementing a new feature
- After any refactoring or restructuring
- When onboarding new team members' code

⏱️ **Estimated time**: 15-30 minutes (per PR of ~200-400 lines)

## Guiding Principles (from Google's Code Review Standards)

1. **Continuous improvement over perfection**: Approve a CL once it definitely improves overall code health, even if not perfect. There's no "perfect" code — only *better* code.
2. **Technical facts over opinions**: Data and engineering principles overrule personal preferences. If multiple approaches are equally valid, accept the author's preference.
3. **Mentoring is part of review**: Leave educational comments prefixed with "Nit: " to indicate polish, not blockers.
4. **Resolve conflicts constructively**: Face-to-face discussion > review comment ping-pong. Escalate to TL or EM if needed. **Don't let a CL sit because of disagreement.**
5. **Style guides are absolute authority**: On style, the project style guide wins. If no guide, be consistent with existing code. If nothing established, accept the author's style.

## Review Checklist

### 1. Design & Architecture
- [ ] Is the design appropriate for the codebase? Does it fit existing patterns?
- [ ] Does this PR add a feature the codebase _should_ have? (Don't approve features that don't belong)
- [ ] Is the code at the right level of abstraction? Not over-engineered, not under-designed
- [ ] Are there clear separation of concerns? UI / business logic / data / API layers
- [ ] Could this be split into smaller, more focused PRs? (Aim for <400 lines per PR)

### 2. Correctness
- [ ] Code does what the spec/acceptance criteria says
- [ ] All edge cases handled (empty states, errors, boundaries, null/undefined)
- [ ] No race conditions or timing bugs (async operations, shared state)
- [ ] Error handling is proper for all async operations (try/catch, error boundaries)
- [ ] Data validation handles unexpected types gracefully

### 3. Code Quality (Google Standard)
- [ ] Functions/methods are focused (single responsibility — one function, one job)
- [ ] No duplicate code (DRY principle) — extract reusable logic
- [ ] No magic numbers or strings — use named constants/enums
- [ ] Variable/function names are descriptive, pronounceable, and consistent
- [ ] Comments explain **why** not **what** (code should be self-documenting)
- [ ] No dead code, commented-out code, or console.log/TODO/FIXME without issue reference
- [ ] No deeply nested conditionals — early returns, guard clauses, or extract methods
- [ ] Complexity is manageable (cyclomatic complexity, cognitive load for reader)

### 4. Type Safety & Linting
- [ ] TypeScript types are properly defined — **no `any` types** (use `unknown` if truly uncertain)
- [ ] No lint warnings or errors (project passes `npm run lint` / `tsc --noEmit`)
- [ ] Null/undefined checks are thorough (optional chaining, nullish coalescing)
- [ ] Discriminated unions for complex state management
- [ ] Generics used appropriately for reusable utilities (not over-abstracted)
- [ ] Exported types/interfaces are well-named and documented

### 5. Testing
- [ ] Unit tests cover the core logic (not just happy path)
- [ ] Edge cases have test coverage (empty arrays, error responses, boundary values)
- [ ] Tests are readable and maintainable (descriptive test names, AAA pattern: Arrange-Act-Assert)
- [ ] Mocking is appropriate and minimal — mock at the boundary, not internally
- [ ] Integration tests cover critical user flows (end-to-end for core paths)
- [ ] Static analysis / SAST tools run (CodeQL, SonarQube, or built-in linter security rules)
- [ ] Tests run in CI and must pass before merge

### 6. React/Component Best Practices
- [ ] Components are reasonably sized (<300 lines, ideally <150)
- [ ] Props are typed with interfaces (with JSDoc for complex props)
- [ ] State is lifted appropriately (not too high, not too low — find the right owner)
- [ ] Side effects handled cleanly in useEffect (deps array correct, cleanup function present)
- [ ] No unnecessary re-renders — React.memo, useMemo, useCallback only where measured benefit
- [ ] Custom hooks extract reusable stateful logic from components
- [ ] Event handlers use useCallback with proper deps if passed as props
- [ ] Forms use controlled components with proper validation

### 7. API & Data Handling
- [ ] API calls have proper error handling (user-facing error message, not just console.error)
- [ ] Loading states and error states are handled in the UI (skeleton/spinner + error boundary)
- [ ] Data transformation happens in the right layer (API layer, not in render)
- [ ] Optimistic updates where appropriate for better UX (with rollback on error)
- [ ] Data is normalized at the right level of abstraction (no raw API shapes in components)

### 8. File Organization
- [ ] Files are organized by feature/domain, not by technical role (feature-based > type-based)
- [ ] Import paths are clean — no deeply nested relative paths (`../../../utils` → use aliases like `@utils/`)
- [ ] Exports are intentional (not barrel exporting everything — explicit is better)
- [ ] File sizes are manageable (<300 lines ideally)
- [ ] Public API of a module is clear from its index/exports

## Project-Specific Notes (YouTube Smart Playlist Creator)

Code patterns to review:
- **YouTube API client**: Proper error handling for quota errors, network failures, malformed responses. Rate limit awareness.
- **Filter logic**: Composable filter functions (duration, video type, tags, date, view count) that chain correctly — test each filter independently
- **Player integration**: YouTube IFrame Player API events (onReady, onStateChange, onError) handled with proper cleanup on unmount
- **Auth flow**: OAuth PKCE flow, token refresh interceptor, protected route handling, logout clearing state
- **State management**: Player state (playing, paused, queue index, shuffle) synchronized across components without duplication
- **localStorage**: Serialization/deserialization with try/catch for corrupted data, version key for migration support

## Prompt Template

Copy and adapt this:

```
Using the Code Review from skills/code-review.md (sourced from google/eng-practices), review [PR / FILES / FEATURE]. Focus on:

1. **Correctness**: Does it work? Are edge cases handled? Error handling?
2. **Design**: Appropriate for the codebase? Separation of concerns? Right abstraction level?
3. **Code quality**: Clean code, naming, duplication, complexity, comments (why not what)
4. **Type safety**: No `any` types? Proper types? Lint passes?
5. **Testing**: Unit tests for core logic + edge cases? Integration for critical flows?
6. **Component design**: Proper React patterns? State management? Side effects?

Reference files:
- [Files to review]
- [Related test files]
- [Related type definitions]
```
