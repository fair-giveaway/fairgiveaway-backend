# Security Policy

## Reporting a Vulnerability

The FairGiveaway team takes security seriously. If you discover a security vulnerability in this project, we appreciate your help in disclosing it responsibly.

**⚠️ Please do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

Send an email to **[support@fairgiveaway.online](mailto:support@fairgiveaway.online)** with:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment** — We will acknowledge your report within 48 hours.
- **Assessment** — We will investigate and assess the severity within 7 days.
- **Fix & Disclosure** — We will work on a fix and coordinate disclosure with you before making any public announcement.

### Scope

The following are in scope for security reports:

- Remote Code Execution (RCE) in the Bun/Elysia layer
- MongoDB injection or Upstash Redis unauthorized access
- Authentication bypasses
- Puppeteer sandbox escapes or unintended SSRF via the scraper
- Exposure of Twitter session cookies or other `.env` secrets
- Dependency vulnerabilities with exploitable impact

The following are **out of scope**:

- Issues in third-party services (Twitter/X API, MongoDB Atlas, Upstash)
- Denial of Service (DoS) requiring massive resources
- Issues requiring physical access to the server

### Recognition

We gratefully acknowledge security researchers who report valid vulnerabilities. With your permission, we will credit you in the release notes of the fix.

---

Thank you for helping keep FairGiveaway safe for everyone.
