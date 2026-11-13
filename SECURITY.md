# Security Policy

## Reporting a vulnerability

Report privately via GitHub *Security → Report a vulnerability*, or email the maintainer listed in
the repository profile. Please do not open a public issue.

Expect an acknowledgement within 72 hours. Confirmed issues are fixed on the default branch and,
where applicable, a CVE or advisory is published afterwards.

## Baseline controls in this project

| Control | Implementation |
| --- | --- |
| Sessions | HMAC-SHA256 signed, `HttpOnly` + `SameSite=Lax` cookie (`Secure` in production), 7-day TTL; bump `SESSION_VERSION` to invalidate every session |
| Authorization | `requireUser` / `requireApprovedUser` / `requireAdmin` / `requireSuperAdmin`; privileged routes re-check the authoritative role and status in MongoDB so demotions apply within 30 seconds |
| Admin area | Middleware redirects `/admin` to `/login` unless the signed cookie carries an admin role |
| Input handling | Zod strict schemas, ObjectId validation, allow-lists, `escapeRegex` for `$regex`, `$set` whitelists |
| Rate limiting | Per-scope/per-identity buckets on Upstash, in-memory fallback |
| CSRF / CORS | `SameSite=Lax` cookies plus an Origin allow-list (`ALLOWED_ORIGINS`) on state-changing `/api` calls |
| Headers | CSP with `report-uri /api/security/csp-report`, HSTS (2 years, preload), `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, COOP/CORP |
| Secrets | Server-only `serverEnv` module; `.env` is git-ignored; production refuses to start without a ≥32-character `AUTH_SECRET` |
| Uploads | Admin-only, MIME allow-list, 25 MB audio / 5 MB image caps, server-side ImageKit authorization |
| Audit trail | `securityEvent` collection with hashed IPs, 90-day TTL, admin-only `/api/security/logs` |
| Health | `/api/health` (public, booleans only) and `/api/integrations/health?probe=1` (admin) |

## If you suspect a credential leak

1. Rotate the credential at the provider first — rotation, not history editing, is what ends the exposure.
2. Update the environment and redeploy.
3. Bump `SESSION_VERSION` to invalidate outstanding sessions.
4. Record what was exposed and for how long.

## Full audit

See [SECURITY-REPORT.md](SECURITY-REPORT.md) for the complete audit, integration details, verified
test results and outstanding action items.
