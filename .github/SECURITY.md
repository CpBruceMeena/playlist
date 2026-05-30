# 🔒 Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently supported:

| Version | Supported |
|---------|-----------|
| v1.x (latest) | ✅ Active development |
| Older versions | ❌ Not supported |

## Reporting a Vulnerability

We take security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

**Please DO NOT file a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities by email to:

**[security@yourdomain.com](mailto:security@yourdomain.com)**

You should receive a response within **48 hours**. If you don't receive a response, please follow up to ensure we received your report.

### What to include

- Type of vulnerability
- Steps to reproduce
- Affected versions / components
- Any potential impact
- Suggested fix (if known)

## Process

1. **Report received**: Acknowledged within 48 hours
2. **Triage**: Assessed within 5 business days
3. **Fix**: Remediation developed and tested
4. **Release**: Patch released (timeline depends on severity)
5. **Disclosure**: Public disclosure after fix is available

## Bug Bounty

We currently do not have a bug bounty program, but we will acknowledge all valid security researchers in our release notes.

## Security Best Practices for This Project

- API keys and secrets are stored as environment variables, never committed to git
- All API endpoints require authentication (except documented public endpoints)
- User input is validated server-side against XSS, SQLi, and injection attacks
- HTTPS/TLS 1.2+ is enforced for all data in transit
- Dependencies are regularly audited for known vulnerabilities
