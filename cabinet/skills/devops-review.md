# 🚀 DevOps Review Skill

Use this skill to conduct a **DevOps and infrastructure review** of the deployment pipeline, hosting, monitoring, and operational readiness.

---

## When to Use

- Before production deployment
- When setting up CI/CD pipeline
- After infrastructure changes
- When evaluating hosting/platform choices

⏱️ **Estimated time**: 15-30 minutes

## Review Checklist

### 1. CI/CD Pipeline
- [ ] Build process is automated (GitHub Actions, etc.)
- [ ] Tests run automatically on PR and before merge
- [ ] Linting and type checking are enforced in CI
- [ ] Build artifacts are cached for faster builds
- [ ] Deployment is automated (no manual steps to release)
- [ ] Rollback strategy is documented and tested
- [ ] Environment-specific configs are managed properly (.env, secrets)

### 2. Hosting & Infrastructure
- [ ] Hosting platform is chosen appropriately (Vercel, Netlify, Railway, etc.)
- [ ] Static assets are served via CDN
- [ ] SSL/TLS is configured (auto-renewing certs)
- [ ] Domain and DNS are configured
- [ ] Database hosting is reliable with automated backups
- [ ] Scaling strategy is defined (vertical vs. horizontal)

### 3. Monitoring & Alerting
- [ ] Error tracking is configured (Sentry, LogRocket, etc.)
- [ ] Performance monitoring is in place (Lighthouse CI, Web Vitals)
- [ ] Server/API health monitoring (uptime checks)
- [ ] Alert thresholds are configured for critical errors
- [ ] Logging infrastructure is set up
- [ ] Dashboard for key metrics (API quota usage, error rates, response times)

### 4. Environment Management
- [ ] Development, staging, and production environments are separate
- [ ] Feature flags/flippers are used for gradual rollouts
- [ ] Database migrations are automated and reversible
- [ ] Secrets are stored securely (not in code or env files committed to git)
- [ ] Environment parity — staging closely mirrors production

### 5. Backup & Recovery
- [ ] Database backups are automated and tested
- [ ] Recovery procedure is documented and practiced
- [ ] Data retention policy is defined
- [ ] Disaster recovery plan exists (what if hosting provider goes down?)
- [ ] Source code is backed up (git, remote repository)

### 6. API Key & Secret Management
- [ ] YouTube API key is stored as environment variable
- [ ] API keys are rotated on a schedule
- [ ] API quota monitoring alerts configured
- [ ] No secrets in client-side code
- [ ] OAuth client secrets are protected

## Project-Specific Notes (YouTube Smart Playlist Creator)

DevOps considerations:
- **Hosting**: Vercel (frontend) + Railway/Render (API server) or all-in-one on a Node.js PaaS
- **YouTube API key**: Must be server-side env variable, never in client bundle or committed to git
- **CI/CD**: Auto-deploy on main branch merge, run lint + typecheck + tests before deploy
- **Monitoring**: Track YouTube API quota usage, set up alerts at 80% daily quota
- **Error tracking**: Sentry or LogRocket for frontend + backend errors
- **Database backups**: Automated daily backups for user playlists and accounts
- **Environment variables**: DATABASE_URL, YOUTUBE_API_KEY, JWT_SECRET, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET

## Prompt Template

Copy and adapt this:

```
@devops-review

Please perform a DevOps review of [PROJECT]. Focus on:

1. **CI/CD**: Is the build/test/deploy pipeline automated and reliable?
2. **Hosting**: Is the infrastructure appropriate for the expected scale?
3. **Monitoring**: Are errors, performance, and uptime tracked?
4. **Backup & recovery**: Can we recover from data loss or outage?
5. **Secret management**: Are API keys and credentials secure?

Reference files:
- [CI/CD config files]
- [Infrastructure config]
- [Deployment documentation]
- [Monitoring setup]
```
