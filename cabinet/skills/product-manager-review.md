# 📋 Product Manager Review Skill

Use this skill to conduct a **Product Manager-level review** of a PRD, feature spec, or product increment. This evaluates requirement completeness, user value, feasibility trade-offs, and scope management.

---

## When to Use

- After drafting a PRD before sharing with the team
- Before sprint planning to refine user stories
- Mid-development to ensure scope hasn't drifted
- Post-launch to evaluate if goals were met

⏱️ **Estimated time**: 15-30 minutes

## Review Checklist

### 1. Requirement Completeness
- [ ] User stories are clear, specific, and testable
- [ ] Acceptance criteria are defined for each story
- [ ] Edge cases and error states are documented
- [ ] Non-functional requirements are included (performance, security, accessibility)
- [ ] Dependencies on other teams/systems are identified

### 2. User Value
- [ ] Each feature solves a real user problem (not just "cool to have")
- [ ] User personas / segments are clearly defined
- [ ] Jobs-to-be-done framework is applied
- [ ] Value proposition is clear for each feature
- [ ] "Why now?" is answered convincingly

### 3. Feasibility & Trade-offs
- [ ] Technical complexity is assessed (low/medium/high)
- [ ] Third-party API limitations are understood (rate limits, quotas, costs)
- [ ] Scope is scoped for MVP vs. v2 (what's in, what's out)
- [ ] Trade-offs are explicitly documented (e.g., speed vs. quality)
- [ ] Riskiest assumptions are identified for early validation

### 4. Prioritization
- [ ] Features are prioritized by value vs. effort
- [ ] Dependencies between stories are mapped
- [ ] Quick wins and hard blockers are identified
- [ ] Out-of-scope items are explicitly listed
- [ ] Success metrics tie back to business goals

### 5. Stakeholder Communication
- [ ] Engineering has been consulted on feasibility
- [ ] Design has reviewed UX implications
- [ ] Support/success teams are aware of upcoming changes
- [ ] Legal/compliance reviewed if needed (e.g., data privacy)
- [ ] Timeline expectations are set with commitments

### 6. Success Measurement
- [ ] North star metric is defined for this feature
- [ ] Leading and lagging indicators are identified
- [ ] A/B test or experiment design is ready (if applicable)
- [ ] Data/analytics requirements are spec'd
- [ ] Post-launch review date is scheduled

## Project-Specific Notes (YouTube Smart Playlist Creator)

Key PRD items to validate:
- **User stories**: US1 (Arijit Singh playlist), US2 (study filters 10-20min), US3 (gym 1hr playlist), US4 (save/replay), US5 (auto-run)
- **Filtering**: 8 filter conditions defined — verify all are implemented and testable
- **Player features**: Auto-advance, shuffle, repeat, skip, queue reorder, progress bar
- **Guest vs Auth**: localStorage vs DB persistence — verify the auth boundary is clear
- **API endpoints**: 4 endpoints defined — verify no missing endpoints for v1
- **Milestones**: M1 (Core Gen by Week 2), M2 (Filters Week 3), M3 (Auth Week 4), M4 (Polish Week 5)
- **Success metrics**: Time to playlist <30s, completion rate >60%, API quota <150 units/gen

## Prompt Template

Copy and adapt this:

```
@product-manager-review

Please perform a PM review of the [PRD / FEATURE]. Focus on:

1. **Completeness**: Are all user stories, edge cases, and criteria defined?
2. **User value**: Does this solve a real problem? Is the value proposition clear?
3. **Prioritization**: Is the scope right for MVP? What should be cut?
4. **Trade-offs**: What risks are we accepting? What assumptions need validation?
5. **Success metrics**: Can we measure if this was successful?

Reference files:
- [PRD link]
- [User research / feedback]
- [Sprint plan]
```
