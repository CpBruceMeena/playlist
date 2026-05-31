# 🎯 Product Development Skills

A comprehensive set of review skills for building great products. Each skill defines a specific review role with checklists and prompt templates that you can invoke during the product development lifecycle.

**Sourced from industry-standard GitHub repositories:** This skill set is built on best practices from [Google Engineering Practices](https://github.com/google/eng-practices), [Shieldfy API Security Checklist](https://github.com/shieldfy/API-Security-Checklist), [Elastisys Security Review](https://github.com/elastisys/security-review), [NHS Digital Accessibility Checklist](https://github.com/NHSDigital/accessibility-checklist), and [OWASP Top 10](https://owasp.org/www-project-top-ten/).

---

## Available Skills

| Skill | Command | Purpose | Est. Time | Source |
|-------|---------|---------|-----------|--------|
| 🏢 **CEO Review** | `@ceo-review` | Strategic alignment, business viability, market fit, risk assessment | 20-40m | General practice |
| 📋 **PM Review** | `@product-manager-review` | Requirement completeness, user value, scope, prioritization | 15-30m | PRD best practices |
| 🎨 **Design Review** | `@design-review` | Visual design, UX flow, responsiveness, interaction quality, a11y basics | 20-40m | Design system standards |
| 💻 **Code Review** | `@code-review` | Google-standard code review — design, correctness, quality, testing | 15-30m | [google/eng-practices](https://github.com/google/eng-practices) |
| 🏗️ **Architecture Review** | `@technical-architecture-review` | System design, scalability, maintainability, data architecture | 20-45m | General practice |
| ✅ **QA Review** | `@qa-review` | Functional testing, edge cases, cross-browser, regression, release readiness | 30-60m | IEEE 829 + general QA |
| ⚡ **Performance Review** | `@performance-review` | Load times, rendering, API efficiency, asset optimization, memory | 20-40m | Web Vitals standards |
| 🔒 **Security Review** | `@security-review` | OWASP Top 10 — auth, API security, input validation, data protection, incident response | 20-40m | [shieldfy/API-Security-Checklist](https://github.com/shieldfy/API-Security-Checklist) + [elastisys/security-review](https://github.com/elastisys/security-review) |
| ♿ **Accessibility Review** | `@accessibility-review` | WCAG 2.2 AA — semantic HTML, keyboard nav, screen readers, contrast, forms | 20-40m | [NHSDigital/accessibility-checklist](https://github.com/NHSDigital/accessibility-checklist) + WCAG 2.2 |
| 🚀 **DevOps Review** | `@devops-review` | CI/CD, hosting, monitoring, backup/recovery, secret management | 15-30m | General practice |
| ⚖️ **Compliance Review** | `@compliance-review` | GDPR, CCPA, YouTube ToS, data privacy, cookie compliance | 20-30m | Legal best practices |

## GitHub Templates

This repo also includes **`.github/` templates** (the industry-standard way to embed reviews into your workflow):

| Template | Location | Purpose |
|----------|----------|---------|
| 📝 **PR Template** | `.github/pull_request_template.md` | Auto-populates with code review checklist on every PR |
| 🆕 **Feature Request** | `.github/ISSUE_TEMPLATE/feature_request.md` | Standard format for feature requests |
| 🐛 **Bug Report** | `.github/ISSUE_TEMPLATE/bug_report.md` | Standard format for bug reports |
| ✅ **QA Review** | `.github/ISSUE_TEMPLATE/qa_review.md` | QA review tracking template with test results table |

## How to Use

Each skill file contains:
1. **Checklist** — review items to go through systematically
2. **Prompt Template** — copy-paste this when asking the AI to perform the review
3. **When to Use** — recommended triggers for running this review

### To Run a Review:

**Option 1 — Load the skill file and paste the prompt template:**
```
Read skills/qa-review.md and use the prompt template to review the current feature.
```

**Option 2 — Direct reference when chatting:**
```
Using the Security Review from skills/security-review.md (sourced from shieldfy/API-Security-Checklist), review the playlist generation API. Focus on authentication, rate limiting, and input validation.
```

**Option 3 — Via the shell script:**
```bash
bash skills/run-review.sh security-review temp-prd.md
```

**Option 4 — Chain multiple reviews in sequence:**
```
Step 1: Perform a Code Review using skills/code-review.md on the recent PR.
Step 2: Then do a Security Review using skills/security-review.md.
Step 3: Then do a QA Review using skills/qa-review.md on staging.
```

## Recommended Workflow

### Full Product Launch Sequence

```
Idea → PRD → PM Review → Design → Design Review + A11y Review
→ Build → Code Review (per PR) → Architecture Review
→ Test → QA Review → Performance Review
→ Security → Security Review → Compliance Review → DevOps Review
→ Launch → CEO Review
```

### For YouTube Smart Playlist Creator (Current Project)

| Phase | Skills | PRD Milestone |
|-------|--------|---------------|
| **Requirements Validation** | `product-manager-review` → `compliance-review` | M1: Core Gen |
| **Design & UX** | `design-review` → `accessibility-review` | M1-M2 |
| **Architecture & Code** | `technical-architecture-review` → `code-review` (per PR) | M1-M2 |
| **Testing** | `qa-review` → `performance-review` | M3-M4 |
| **Pre-Launch Gate** | `security-review` → `devops-review` → `ceo-review` | M4 |
