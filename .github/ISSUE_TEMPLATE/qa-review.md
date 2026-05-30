---
name: ✅ QA Review
about: Track quality assurance review tasks and results
title: "[QA] Review: "
labels: qa
assignees: ""
---

## Feature / Release Under Review

<!-- What feature, PR, or release is being reviewed? -->

## Test Environment

- **Staging URL**:
- **Branch / Version**:
- **Browser(s) Tested**:
- **Device(s) Tested**:

## Test Results

### Functional Tests

| Test Case | Expected | Actual | Status (✅/❌) |
|-----------|----------|--------|----------------|
| | | | |
| | | | |

### Edge Cases Tested

- [ ] Empty states
- [ ] Error states (network failure, timeout, 4xx/5xx)
- [ ] Long inputs / special characters
- [ ] Rapid repeated clicks (debouncing)
- [ ] Zero results from API
- [ ] API quota exceeded

### Cross-Browser

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Safari
- [ ] Chrome Android

### Regression

- [ ] Previously fixed bugs still fixed
- [ ] Adjacent features not broken

## Bugs Found

| ID | Severity (P0-P3) | Description | Link |
|----|-------------------|-------------|------|
| | | | |

## Release Readiness

- [ ] All P0/P1 bugs resolved
- [ ] Known issues documented with workarounds
- [ ] Feature flags configured correctly
- [ ] Error monitoring configured
- [ ] Documentation updated

## Verdict

- [ ] ✅ Approved for release
- [ ] ❌ Blocked (see bugs above)
- [ ] ⏳ Conditional (address P0/P1 before release)
