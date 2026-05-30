## Description

<!-- Briefly describe what this PR does and why. Link to the issue if applicable. -->

Closes #ISSUE_NUMBER

## Type of Change

- [ ] 🆕 New feature
- [ ] 🐛 Bug fix
- [ ] ♻️ Refactor
- [ ] 🎨 Style/UI
- [ ] 📝 Documentation
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 DevOps / CI

## How Has This Been Tested?

<!-- Describe the tests you ran to verify your changes. -->

- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing (describe below)

## Review Checklist

### Functionality
- [ ] Code works as described in the acceptance criteria
- [ ] Edge cases handled (empty states, errors, boundaries)
- [ ] Error states have user-friendly messages
- [ ] Loading/empty states are covered

### Code Quality
- [ ] No `console.log`, `debugger`, or `TODO` without issue reference
- [ ] Functions are focused (single responsibility)
- [ ] No magic numbers/strings — constants/enums used
- [ ] Comments explain **why** not **what**
- [ ] No dead code or commented-out code

### TypeScript / Types
- [ ] No `any` types — use `unknown` if uncertain
- [ ] Props/state properly typed with interfaces
- [ ] Null/undefined checks thorough (optional chaining, nullish coalescing)

### React Best Practices
- [ ] Components not unnecessarily large (<300 lines)
- [ ] Side effects cleaned up on unmount
- [ ] No unnecessary re-renders

### Security
- [ ] User inputs validated/sanitized
- [ ] No sensitive data in client-side code (API keys, tokens, PII)
- [ ] API calls use proper authentication headers

### Testing
- [ ] Tests added/updated for changes
- [ ] Tests pass locally (`npm test` / `npm run test`)
- [ ] Edge cases covered in tests

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes. -->

## Additional Notes

<!-- Any other information that would be helpful for reviewers. -->
