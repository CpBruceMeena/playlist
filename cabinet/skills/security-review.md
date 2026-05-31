# 🔒 Security Review Skill

Use this skill to conduct a **security review** of the application, API, and infrastructure. This evaluates vulnerabilities, authentication, data protection, and compliance.

**Sourced from industry standards:** [shieldfy/API-Security-Checklist](https://github.com/shieldfy/API-Security-Checklist), [elastisys/security-review](https://github.com/elastisys/security-review), OWASP Top 10

---

## When to Use

- Before any production release
- After implementing authentication or authorization
- When handling user data or PII
- When integrating third-party APIs (OAuth, payments, etc.)
- On a regular cadence (quarterly or per major release)

⏱️ **Estimated time**: 20-40 minutes

## Review Checklist

### 1. Authentication (OWASP + Shieldfy API Security)
- [ ] Don't use Basic Auth — use standard authentication (OAuth 2.0, JWT, API keys)
- [ ] Don't reinvent token generation or password storage — use industry standards (bcrypt/argon2 for passwords)
- [ ] Use `Max Retry` and jail/lockout features on login endpoints (e.g., 5 failed attempts = 15-min lockout)
- [ ] Encrypt all sensitive data at rest and in transit (TLS 1.2+ for transit)
- [ ] JWT tokens have short expiry (15-30 min) + refresh token rotation with 7-day expiry
- [ ] Session cookies are HTTP-only, Secure, SameSite=Lax/Strict

### 2. Authorization & Access Control
- [ ] Role-based access control (RBAC) is enforced server-side (never trust client-side roles)
- [ ] User-specific resource IDs should be avoided — use `/me/orders` instead of `/user/654321/orders`
- [ ] Don't auto-increment IDs — use UUIDs for all resource identifiers
- [ ] OAuth: Always validate `redirect_uri` server-side against a safelist
- [ ] OAuth: Use `state` parameter with random hash to prevent CSRF on auth flow
- [ ] OAuth: Use PKCE flow for public clients (SPAs, mobile apps)
- [ ] OAuth: Define and validate default scope for each application
- [ ] Limit requests (rate limiting/throttling) to prevent DDoS/brute-force attacks (sliding window per API key + IP)
- [ ] For private APIs, allow access only from safelisted IPs/hosts

### 3. Input Validation & Sanitization
- [ ] All user inputs are validated server-side (never trust client)
- [ ] Use proper HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE (delete) — respond 405 for mismatches
- [ ] Validate `content-type` on request Accept header — respond 406 for unsupported formats
- [ ] Validate `content-type` of posted data (application/json, multipart/form-data, etc.)
- [ ] SQL injection prevention (parameterized queries / ORM — never string concatenation)
- [ ] XSS prevention (output encoding, CSP headers with `default-src 'none'`)
- [ ] No direct eval() or dangerouslySetInnerHTML without sanitization
- [ ] File uploads validated (type via magic bytes, size limits, content scanning)
- [ ] URL redirects validated (no open redirects — whitelist allowed domains)
- [ ] Don't use sensitive data (credentials, passwords, tokens, API keys) in URLs — use Authorization header
- [ ] If parsing XML: disable external entity parsing to prevent XXE attacks
- [ ] If parsing XML/YAML with anchors/refs: disable entity expansion to prevent Billion Laughs attack

### 4. API Security (Shieldfy API Security Checklist)
- [ ] All endpoints are protected behind authentication (except explicitly public ones)
- [ ] CORS configured with specific origins (not `*` in production)
- [ ] API keys/secrets are never exposed client-side
- [ ] Request size limits enforced (e.g., max 1MB payload)
- [ ] Sensitive data is never logged (passwords, tokens, PII, credit cards)
- [ ] API versioning and deprecation policy documented
- [ ] Response headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: deny`, `Content-Security-Policy: default-src 'none'`
- [ ] Remove fingerprinting headers: `X-Powered-By`, `Server`, `X-AspNet-Version`
- [ ] Return proper HTTP status codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 405 Method Not Allowed, 406 Not Acceptable, 429 Too Many Requests
- [ ] Use an API Gateway for caching, rate limiting (quota, spike arrest, concurrent rate limit)
- [ ] Don't return overly specific error messages — use generic messages, log details server-side
- [ ] GraphQL (if used): Disable introspection in production, implement query depth limiting, use query cost analysis

### 5. Data Protection (Elastisys Cloud Security)
- [ ] Data in transit encrypted (HTTPS/TLS 1.2+ with secure ciphers, HSTS header)
- [ ] Data at rest encrypted (database encryption, encrypted volumes)
- [ ] PII minimized — only collect what's needed, anonymize where possible
- [ ] LocalStorage doesn't store sensitive data (tokens, PII, API keys)
- [ ] Data export/deletion available (GDPR right to access + right to erasure)
- [ ] Backup and disaster recovery plan exists and is tested regularly
- [ ] Cryptographic keys rotated on a regular schedule
- [ ] Regular backups of production clusters — test restoring from backups

### 6. Third-Party Dependencies (Shieldfy CI&CD)
- [ ] Dependencies audited regularly (npm audit, Snyk, Dependabot, OWASP Dependency-Check)
- [ ] No known vulnerable packages in use (check CVE databases)
- [ ] YouTube API key is not exposed client-side (server-side proxy pattern)
- [ ] OAuth scopes are minimal (principle of least privilege)
- [ ] Third-party scripts have Subresource Integrity (SRI) hashes
- [ ] Components scanned by AV software before pushing to production
- [ ] Container images scanned for vulnerabilities before entering production
- [ ] Process to get alerted when a dependency becomes vulnerable in production

### 7. Infrastructure Security (Elastisys Cloud Security)
- [ ] Environment variables for secrets (never in code or committed .env files)
- [ ] Secrets stored in a secrets manager (Vault, AWS Secrets Manager, etc.) — use HSM for signing operations
- [ ] Firewall rules configured (only necessary ports open, network segregation)
- [ ] Database is not publicly accessible
- [ ] Error messages don't leak stack traces in production (DEBUG mode OFF)
- [ ] Security headers set: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- [ ] Logging/monitoring for security events (failed logins, unusual patterns, blocked outbound traffic)
- [ ] IDs/IPS system monitoring API requests and instances
- [ ] mTLS for service-to-service communication (Zero Trust)
- [ ] Implement secret scanning in CI/CD pipelines

### 8. Incident Management (Elastisys Security)
- [ ] Clear definition of what constitutes a security incident
- [ ] Defined roles for incident response (Incident Commander, Comms Lead, Ops Lead)
- [ ] Escalation process for incidents not responded to in time
- [ ] Regular practice/drills of incident management procedures
- [ ] Postmortem analysis performed after every incident
- [ ] Runbooks maintained for common security incidents
- [ ] Process for external stakeholders to report security issues (SECURITY.md)

## Project-Specific Notes (YouTube Smart Playlist Creator)

Key security considerations:
- **YouTube Data API v3 key**: Must be server-side only, never exposed in client bundle — use proxy pattern in `/api/generate`
- **Google OAuth**: Implement PKCE flow, validate `state` parameter, use minimal scopes (`profile`, `email` only)
- **User-generated content**: Playlist names/titles could contain XSS vectors — sanitize output on render
- **localStorage**: Only store non-sensitive data (playlist references, display names). No tokens or PII in localStorage
- **API endpoints**: All `/api/playlists/*` routes must enforce authentication server-side (JWT middleware)
- **Share links**: Playlist share links (`/p/{id}`) should use UUIDs, not sequential IDs — prevent enumeration
- **Rate limiting**: Apply rate limits to `/api/generate` (e.g., 10 requests/min per IP) to prevent API key abuse
- **API quota monitoring**: Set up alerts at 80% of YouTube daily API quota usage

## Prompt Template

Copy and adapt this:

```
Using the Security Review from skills/security-review.md (sourced from shieldfy/API-Security-Checklist + elastisys/security-review), perform a security review of [PROJECT / FEATURE]. Focus on:

1. **Authentication**: Are we following OWASP standards? Rate limiting, retry jails, password hashing?
2. **Authorization**: Is RBAC enforced server-side? UUIDs vs sequential IDs? OAuth state/PKCE?
3. **API security**: Are endpoints protected? CORS? Response headers? Status codes?
4. **Input validation**: XSS, SQLi, injection, file upload protections?
5. **Data protection & compliance**: PII handling, encryption, GDPR readiness?
6. **Dependencies & infra**: Vulnerability scanning, secrets management, incident response?

Reference files:
- [Auth implementation files]
- [API endpoint definitions]
- [Dependency manifests (package.json, etc.)]
- [Infrastructure config files]
```
