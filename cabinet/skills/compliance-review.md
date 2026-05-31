# ⚖️ Compliance Review Skill

Use this skill to conduct a **compliance and data privacy review** of the application. This evaluates GDPR, CCPA, YouTube ToS compliance, data retention policies, and legal readiness.

---

## When to Use

- Before any production launch with user data
- When implementing authentication or user accounts
- When storing any user-generated content or PII
- When integrating third-party APIs (YouTube, Google OAuth, etc.)
- On a regular compliance cadence (quarterly)

⏱️ **Estimated time**: 20-30 minutes

## Review Checklist

### 1. Data Collection & Processing
- [ ] All data being collected is documented with clear purpose
- [ ] Only minimum necessary data is collected (data minimization)
- [ ] Users are informed what data is collected and why (privacy policy)
- [ ] Consent is obtained before collecting non-essential data
- [ ] Data processing purposes are documented

### 2. GDPR Compliance
- [ ] Right to access — users can request their data
- [ ] Right to rectification — users can correct inaccurate data
- [ ] Right to erasure ("right to be forgotten") — users can delete their account and data
- [ ] Right to data portability — users can export their playlists
- [ ] Data processing agreement (DPA) in place with cloud providers
- [ ] Privacy policy covers GDPR requirements

### 3. CCPA Compliance
- [ ] Right to know — users can see what data is collected/sold
- [ ] Right to opt-out of data sale (if applicable)
- [ ] Right to delete — users can request deletion
- [ ] Non-discrimination policy for exercising CCPA rights
- [ ] "Do Not Sell My Personal Information" link (if applicable)

### 4. YouTube Terms of Service
- [ ] YouTube API Services Terms of Service are reviewed and followed
- [ ] Google Privacy Policy is linked in the app (required by YouTube ToS)
- [ ] No downloading of YouTube videos (streaming only — confirmed in PRD)
- [ ] Proper attribution to YouTube for video content
- [ ] YouTube branding guidelines are followed for the player
- [ ] API usage complies with YouTube's acceptable use policy
- [ ] No misleading users about content ownership

### 5. Cookie & Tracking Compliance
- [ ] Cookie consent banner is implemented (where required)
- [ ] LocalStorage usage is disclosed in privacy policy
- [ ] Analytics tools (if any) have privacy-compliant configuration
- [ ] Third-party cookies are minimized
- [ ] Cookie preferences are stored and respected

### 6. Data Security & Retention
- [ ] Data retention policy is defined (how long playlists/data are kept)
- [ ] Inactive account data cleanup process exists
- [ ] Data breach notification procedure is documented
- [ ] Incident response plan is in place
- [ ] User data is anonymized or pseudonymized where possible

### 7. Terms of Service
- [ ] Terms of Service (ToS) are written and accessible
- [ ] ToS covers: acceptable use, content ownership, liability limitations
- [ ] ToS covers: account termination policy, dispute resolution
- [ ] ToS is reviewed by legal counsel
- [ ] Version history and change notification process for ToS

## Project-Specific Notes (YouTube Smart Playlist Creator)

Compliance considerations specific to this project:
- **YouTube ToS**: Must display Google Privacy Policy link (required by YouTube API Terms of Service)
- **Data collected**: User email (if OAuth), playlist names, video IDs, search queries
- **localStorage**: Guest playlists stored client-side — disclose in privacy policy
- **GDPR**: Users must be able to export (JSON download) and delete their playlists and account
- **CCPA**: If selling/ sharing data (unlikely for v1), must provide opt-out
- **Copyright**: Streaming only (no download). User-generated playlists are not our liability, but should have a DMCA takedown process
- **Children privacy**: COPPA — if targeting users under 13, special requirements apply. Default to not collecting personal info from minors

## Prompt Template

Copy and adapt this:

```
@compliance-review

Please perform a compliance review of [PROJECT]. Focus on:

1. **Data collection**: What data do we collect? Is it necessary? Are users informed?
2. **GDPR/CCPA**: Can users access, export, and delete their data?
3. **YouTube ToS**: Do we comply with YouTube API Services terms?
4. **Privacy**: Cookie consent, LocalStorage disclosure, privacy policy
5. **Terms of Service**: Are ToS written and legally reviewed?

Reference files:
- [Privacy policy]
- [Terms of service]
- [Data flow documentation]
- [Auth/user management code]
```
