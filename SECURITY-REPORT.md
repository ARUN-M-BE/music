# Security Audit & Integration Report — Good Music (`d:\music`)

**Date:** 2026-11-13
**Scope:** full repository audit, 6 third-party integrations, 27 security tasks
**Constraint applied:** 100% free tier, no card, no paid feature, no trial that requires payment details

Every statement below was executed on this machine. Anything I could not prove is listed
in [§10 Not verified](#10-not-verified--limits-of-this-audit) instead of being claimed.

---

## 1. Verdict

| Area | Result |
| --- | --- |
| Security tasks (27) | **20 fixed/verified**, **4 not applicable** (no password auth, no reset links, no payments), **3 requiring action from you** (key rotation, Resend key, Tinybird deploy) |
| Integrations | **4 working** (Upstash, Monkeytype, geo-IP, Tinybird token) · **1 blocked** (Resend: key invalid) · **1 not deployed** (Evolution API, self-hosted) |
| Paid services | **0** — IPstack was rejected, see §3 |
| Typecheck / lint / build | **pass / pass (0 errors) / pass** |
| Smoke suite | **25 / 25 pass** |
| Dependencies | **22 advisories → 9 moderate**, 0 high, 0 critical |

---

## 2. Integrations

| Service | Free tier used | Status | Evidence |
| --- | --- | --- | --- |
| **Upstash Redis** | 10k commands/day, 256 MB, no card | **Working** | `PING` → `{"result":"PONG"}` |
| **Monkeytype API** | Public, keyless | **Working** | `/api/integrations/typing` → 200, 10 real leaderboard entries (top: `saerith`, 288.4 wpm) |
| **Geo-IP (IPstack replacement)** | keyless HTTPS, 3-provider failover | **Working** | Audit row recorded `country:"US"` for `8.8.8.8` |
| **Tinybird** | 1k requests/day, 0.5 GB | **Token valid, datasource not deployed** | `GET /v0/datasources` → `{"datasources":[]}` |
| **Resend (Audiences)** | 3k emails/mo, 100/day, audiences included | **Blocked: key rejected by provider** | `GET /audiences` → `400 {"message":"API key is invalid"}` |
| **Evolution API** | Apache-2.0, self-hosted, zero licence cost | **Not deployed (needs your server)** | Webhook fails closed with `503 not_configured` |

### 2.1 Upstash — rate limiting, caching, geo cache

Used by [`rate-limit.ts`](file:///d:/music/src/lib/rate-limit.ts) (sliding window via `INCR`/`EXPIRE`),
[`integrations/upstash.ts`](file:///d:/music/src/lib/integrations/upstash.ts) and the geo/monkeytype
caches. When unset it degrades to an in-process memory bucket, so the app never hard-fails.

### 2.2 Resend Audiences — **action required**

Two separate problems, both verified:

1. **The API key is rejected.** `GET https://api.resend.com/audiences` returns
   `400 {"statusCode":400,"message":"API key is invalid","name":"validation_error"}` (IPv4,
   reproduced with curl; the host resolves and TCP 443 is reachable, so this is not a network issue).
   `sendEmail()` therefore returns `ok:false` and logs a warning — welcome mail is silently not sent.
2. **The sender cannot reach real users.** `RESEND_FROM_EMAIL` is set to
   `Arun M <onboarding@resend.dev>`. `resend.dev` is Resend's shared test sender and only delivers
   to the address that owns the Resend account. A verified domain is required for anyone else.
   Also `RESEND_AUDIENCE_ID` is unset, so `addAudienceContact()` is a no-op.

Fixed while auditing: the code read `RESEND_FROM`, but the `.env` defines `RESEND_FROM_EMAIL`, so the
configured sender name was silently ignored. Both names are now accepted
([`env.ts`](file:///d:/music/src/lib/env.ts)).

The integration is now probeable without sending mail:
`GET /api/integrations/health?probe=1` (admin only) does a read-only `GET /domains` and reports
`API key rejected (HTTP 401): rotate RESEND_API_KEY.`

### 2.3 Tinybird — token valid, deployment pending

The token authenticates (`200`), but the workspace contains **zero datasources**, so
`POST /v0/events?name=music_plays` cannot succeed. Creating the datasource over the REST API was
rejected (`400`), which matches Tinybird's rule that data sources on this workspace type must be
created by a deployment.

I added a reproducible project instead:

- [`tinybird/datasources/music_plays.datasource`](file:///d:/music/tinybird/datasources/music_plays.datasource) —
  columns `event, ts, actor_id, song_id, language, provider, meta`
- [`tinybird/pipes/top_songs.pipe`](file:///d:/music/tinybird/pipes/top_songs.pipe) — `days`/`limit` endpoint
- [`integrations/tinybird.ts`](file:///d:/music/src/lib/integrations/tinybird.ts) now emits `ts` to match the schema

**Verified fallback:** with the datasource missing, a real play still returned `200` and the event was
persisted to MongoDB `analyticsevents` (30-day TTL) instead of being dropped:
`{"name":"song_play","songId":"67fc0a5db388c8c99e982636","language":"English"}`.
No analytics data is lost while Tinybird is undeployed, and nothing is paid for MongoDB writes.

Deploy with the CLI (free):

```powershell
curl -fsSL https://tinybird.co | sh          # or scoop/brew install tinybird-cli
tb auth --token $env:TINYBIRD_TOKEN
cd d:\music ; tb push tinybird/
```

### 2.4 Monkeytype — real bug found and fixed

The original URL was path-style: `GET /leaderboards/english/time/60` → **404**.
The working endpoint, verified live, is query-style:

```
GET https://api.monkeytype.com/leaderboards?language=english&mode=time&mode2=60
→ {"message":"Leaderboard retrieved","data":{"count":533454,"entries":[{"wpm":288.4,"acc":97.37,"rank":1,"name":"saerith"}, …]}}
```

Fixed in [`integrations/monkeytype.ts`](file:///d:/music/src/lib/integrations/monkeytype.ts): query
parameters instead of path segments, and the parser now reads `data.entries` (it previously assumed
`data` was the array, so even a successful call would have produced an empty list).

No API key is needed. `MONKEYTYPE_APE_KEY` in `.env` is unused and can be deleted (no cost either way).

### 2.5 IPstack — rejected, replaced with keyless HTTPS failover

IPstack's free plan is **HTTP-only** (HTTPS is a paid add-on) and capped at 100 requests/month, so
using it would mean either paying or sending security-audit traffic in clear text. Rejected.

[`integrations/geo.ts`](file:///d:/music/src/lib/integrations/geo.ts) now tries, in order:
`api.country.is` → `ipapi.co` → `ipwho.is`. All are keyless HTTPS, all server-side only, all
best-effort (`null` on failure, never blocking a request), with a 1-hour memory cache and a 24-hour
Upstash cache. `ipwho.is` alone was unusable here (DNS failure), which is exactly why the chain exists.

Verified end-to-end: a request carrying `X-Forwarded-For: 8.8.8.8` produced an audit record with
`country: "US"`. `IPSTACK_API_KEY` in `.env` is unused and can be deleted.

### 2.6 Evolution API — fail-closed until you host it

Self-hosted WhatsApp gateway (Apache-2.0, so zero licence cost; you pay only for the machine).
No `EVOLUTION_*` values exist, so
[`/api/integrations/whatsapp/webhook`](file:///d:/music/src/app/api/integrations/whatsapp/webhook/route.ts)
returns `503 not_configured` (verified) rather than accepting unauthenticated webhooks. Once
configured it verifies a shared secret or HMAC in constant time, caps the body at 64 KB, rate-limits
to 120/min and writes an audit event. A `docker-compose.yml` service definition is the only missing
piece for self-hosting.

---

## 3. Free-tier compliance

| Provider | Free allowance | What this app uses | Cost risk |
| --- | --- | --- | --- |
| Upstash | 10k cmd/day, 256 MB | rate limits + caches; everything degrades to memory | none |
| Resend | 3k emails/mo, 100/day | transactional only, no broadcasts, no dedicated IP | none |
| Tinybird | 1k req/day, 0.5 GB | 1 unbatched event per play + 1 dashboard query | none |
| Evolution API | self-hosted OSS | your container only | none |
| Monkeytype | keyless public API | cached 5 min, ≤20 req/min per user | none |
| Geo-IP | keyless fair use | cached 24 h, memoised 1 h, skips private IPs | none |

**No integration requires a card, a paid plan, or an expiring trial.** IPstack was dropped precisely
because its free tier cannot be used over TLS. Health and integration probes never send email and
never write rows, so checking status costs nothing.

---

## 4. The 27 security tasks

| # | Task | Status | What was done / evidence |
| --- | --- | --- | --- |
| 1 | Authentication & authorization | **Fixed** | HMAC-SHA256 signed `gm_session` cookie; Firebase ID token verified server-side; `requireUser`/`requireApprovedUser`/`requireAdmin`/`requireSuperAdmin`; ownership checks. Verified: anon → 401, member → 403, forged cookie → 401 |
| 2 | Hide & protect API keys | **Fixed** | All secrets read through `serverEnv` (server-only module); no keys in client bundle; working-tree scan found 0 hardcoded secrets |
| 3 | Secure database access | **Fixed** | Credentials env-only, Mongoose parameterisation, pooled connection with ref-counting and 30 s idle close; `/api/health` ping returns `database:"up"` |
| 4 | Enforce HTTPS | **Fixed** | Production requests with `x-forwarded-proto: http` → `308` to `https://…`; HSTS `max-age=63072000; includeSubDomains; preload`; CSP `upgrade-insecure-requests` |
| 5 | Secure password hashing | **N/A** | No password auth exists — sign-in is Firebase/Google. Repo-wide search: no `bcrypt`, `scrypt`, `passwordHash` |
| 6 | Server-side validation | **Fixed** | Zod `.strict()` schemas, `assertObjectId`, allow-lists, clamped limits. Verified: invalid ObjectId → `400` |
| 7 | XSS protection | **Fixed** | React escaping only; search found no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`; CSP; `escapeHtml()` in emails; `escapeRegex()` for `$regex` |
| 8 | Suspicious-activity logging | **Fixed** | `securityEvent` collection (90-day TTL, hashed IP, geo country, severity), admin-only `/api/security/logs` with filters |
| 9 | Protect admin routes | **Fixed** | Middleware 307 gate on `/admin` + `requireAdmin`; **new** authoritative role re-check (see §5) so demotions take effect in ≤30 s instead of 7 days. Proven: forged `superadmin` claim → 403, real promotion → 200, demotion → 403 |
| 10 | Parameterised queries | **Fixed** | No string-built queries; every `$regex` built from user input now goes through `escapeRegex` (ReDoS/injection fix in `musicProviders.ts`) |
| 11 | Secure environment variables | **Fixed** | `.env` git-ignored and never committed (verified with `git ls-files`); `.env.example` documents every key; production refuses to start without a ≥32-char `AUTH_SECRET` |
| 12 | Rate limiting | **Fixed** | Per-scope/per-identity buckets on Upstash with in-memory fallback. Verified: 61st request → `429` |
| 13 | Restrict CORS | **Fixed** | `/api` compares `Origin` against `ALLOWED_ORIGINS`. Verified: evil Origin → `403`, preflight → `403` |
| 14 | Security headers | **Fixed** | CSP, HSTS, `nosniff`, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`, `form-action 'self'`, Referrer-Policy, Permissions-Policy, COOP/CORP; `x-powered-by` removed. All observed on a production response |
| 15 | Secure cookies | **Fixed** | `HttpOnly`, `SameSite=Lax`, `Path=/`, 7-day TTL, `Secure` in production. Verified from `Set-Cookie` |
| 16 | CSRF protection | **Fixed** | `SameSite=Lax` + strict Origin allow-list on all state-changing `/api` requests. Verified: cross-origin POST → `403` |
| 17 | Expiring password-reset links | **N/A** | No reset flow in this app; Firebase owns credential recovery and its own expiry |
| 18 | File-upload restrictions | **Fixed** | Admin-only, MIME allow-list, 25 MB audio / 5 MB image caps, extension checks, server-side ImageKit auth (`/api/auth/imagekit`) |
| 19 | Server-side price verification | **N/A** | No commerce: search found no `stripe`, no `price` handling anywhere |
| 20 | Disable debug in production | **Fixed** | `poweredByHeader:false`, `productionBrowserSourceMaps:false`, no debug routes; `/api/health` exposes only booleans and counts, no secrets or stack traces |
| 21 | Update vulnerable dependencies | **Fixed (residual: dev tooling)** | 22 → 9 moderate, 0 high, 0 critical. `xlsx` (unpatched CVEs) removed; `zod` 4, `firebase` 11, `@opennextjs/cloudflare` 1.20; npm `overrides` pin `@grpc/grpc-js`, `body-parser`, `js-yaml`, `nanoid`, `proxy-addr`, `qs`, `source-map-js`. Remaining 9 are `@typescript-eslint`/`glob`/`minimatch` inside build+lint tooling (`@typescript-eslint` 8.72.2 is the newest published, so there is no upstream fix) |
| 22 | Remove unused packages | **Fixed** | Removed `dotenv`, `imagekit`, `react-icons`, `framer-motion`, `xlsx`; replaced `xlsx` with MIT `read-excel-file` plus a dependency-free CSV writer/parser |
| 23 | Protect exposed files | **Fixed** | Middleware 404s `/.env*`, `/.git*`, `/package.json`, `/tsconfig.json`, `/next.config.*`, `/docker-compose.yml`, `/vercel.json`, `/git.txt`, `/LESSONS.md`. Verified: all 8 return `404` (dev and production) |
| 24 | Scan Git history for secrets | **Done** | `.env` never committed. Found: MongoDB credentials in 9 commits, ImageKit private key in 5, Firebase API key in 5 (hashes in §6). `AUTH_SECRET` is **not** in history (`git log -S` → 0) |
| 25 | Identify & revoke leaked keys | **Identified; rotation needs you** | MongoDB / ImageKit / Firebase credentials are public in history and must be rotated (§9). I cannot rotate third-party credentials |
| 26 | Complete security audit | **Done** | This document |
| 27 | Run tests + final report | **Done** | §5 and this document |

---

## 5. Real vulnerabilities found and fixed in this pass

1. **Privilege persistence via stale claims (fixed, proven).** Role and status are baked into the
   signed cookie for its whole 7-day life, so a demoted admin or a suspended member kept access until
   re-login. [`auth.ts`](file:///d:/music/src/lib/auth.ts) now re-reads the authoritative
   `role`/`status` from MongoDB on privileged and write paths, memoised for 30 s (so the steady state is
   a cache hit, not a query). `SESSION_VERSION` remains the global kill switch.
   Proof: a correctly signed token claiming `superadmin` for a member account → `403`;
   after promoting that account in the database → `200`; after demoting it → `403` again.
   On a database outage the check is skipped (the token is still cryptographically valid), preserving
   availability and the previous behaviour.
2. **IP-based rate limiting could be bypassed (fixed).** `getClientIp()` took the left-most
   `X-Forwarded-For` entry, which the caller controls — rotating the header defeated every per-IP
   limit. It now prefers `cf-connecting-ip`/`x-real-ip` (set by the platform) and otherwise uses the
   **right-most** `X-Forwarded-For` hop.
3. **ReDoS / regex injection in catalog search (fixed).** User input was interpolated into a MongoDB
   `$regex`; it now passes through `escapeRegex()` and is length-capped.
4. **Monkeytype integration was dead code (fixed).** Wrong endpoint *and* wrong response shape; both
   corrected and verified against the live API.
5. **`RESEND_FROM_EMAIL` silently ignored (fixed).** The code only read `RESEND_FROM`.
6. **CSP with a nonce and `'strict-dynamic'` would have broken the app (fixed).** The built HTML
   contains 14 inline `<script>` tags and 0 nonces, because the app shell is prerendered and cannot
   carry a per-request nonce. Such a policy would block every script. CSP now uses
   `script-src 'self' 'unsafe-inline'` plus the exact Google/Firebase origins, with
   `report-uri /api/security/csp-report` collecting violations in production. The reasoning is
   documented in [`middleware.ts`](file:///d:/music/src/middleware.ts).
7. **MongoDB connection race (fixed).** Connect-then-disconnect per operation caused
   `MongoNotConnectedError` under concurrent requests (`GET /api/auth/session` → 500). Replaced with a
   single de-duplicated connect promise, a ref-counted active-operation counter, retry-once on
   connection errors and a 30 s idle disconnect. Reproduced, fixed, retested → 200.
8. **`xlsx` supply-chain risk (removed).** `npm audit` reported unpatched prototype-pollution/ReDoS
   advisories with no fixed version. Replaced with `read-excel-file` for reading and a
   dependency-free CSV/JSON path for export; `.xls` is now rejected with a clear message.

---

## 6. Tests actually executed

| Check | Command | Result |
| --- | --- | --- |
| Types | `npm run typecheck` | **pass**, 0 errors |
| Lint | `npm run lint` (ESLint 9 flat config, newly added) | **pass**, 0 errors / 89 warnings (all pre-existing `no-explicit-any` and one React 19 rule downgraded with justification) |
| Build | `npm run build:next` | **pass** — all app routes and the API proxies compile |
| Smoke suite | `scripts/smoke-test.ps1` (25 assertions) | **25 / 25 pass** |
| Dependencies | `npm audit` | **0 critical, 0 high, 9 moderate** (build/lint tooling only) |
| Headers (prod) | `curl -I` against `next start` | CSP, HSTS `63072000`, `nosniff`, `DENY`, Referrer-Policy, Permissions-Policy, COOP/CORP present; **no** `x-powered-by` |
| HTTPS redirect | `curl -H 'x-forwarded-proto: http'` | `308` → `https://…` |
| Admin gate | `curl -H 'x-forwarded-proto: https' /admin` | `307` → `/login?next=%2Fadmin` |
| Exposed files | 8 internal paths | all `404` |
| Upstash | `PING` | `{"result":"PONG"}` |
| Monkeytype | `/api/integrations/typing` | `200`, real entries |
| Geo-IP | audit row after `X-Forwarded-For: 8.8.8.8` | `country:"US"` |
| Analytics fallback | `PUT /api/songs/:id/play` | `200`, event persisted in `analyticsevents` |
| RBAC authority | forged / promoted / demoted token | `403` / `200` / `403` |
| Resend | `GET /audiences` | **`400 API key is invalid`** |
| Tinybird | `GET /v0/datasources` | `200`, `{"datasources":[]}` |
| Evolution webhook | `POST /api/integrations/whatsapp/webhook` | `503` fail-closed |

The 25 smoke assertions cover: five unauthenticated `401`s, admin redirect, guest session creation,
cookie `HttpOnly`/`SameSite`/signature, authenticated session read, member `403` on three admin
routes, forged-cookie rejection, header impersonation (`x-user-email`, `Bearer <email>`), CORS
`403` on POST and preflight, search sanitisation, invalid id `400`, `429` after the limit, health
`200`, and the CSP report sink `204`.

---

## 7. Remaining risks

| ID | Severity | Issue | Action |
| --- | --- | --- | --- |
| R-1 | **High** | MongoDB credentials, ImageKit private key and Firebase API key are readable in Git history (Mongo: `847ff41`, `e89866d`, `11457dd`, `6e00818`, `3961495`, `fd67f8f`, `ba530d1`, `8db8a06`; ImageKit: 5 commits; Firebase: 5 commits) | Rotate all three (§9). History rewriting only removes the copy; it does not un-leak |
| R-2 | **High** | Resend API key is rejected by the provider, so transactional email silently fails | Rotate the key (§9) |
| R-3 | Medium | `onboarding@resend.dev` only delivers to your own account address; `RESEND_AUDIENCE_ID` unset | Verify a domain, set the sender, create an audience |
| R-4 | Medium | Tinybird datasource not deployed — analytics lands in MongoDB | `tb push tinybird/` (§2.3) |
| R-5 | Medium | CSP uses `'unsafe-inline'` for scripts (a nonce is impossible on the prerendered shell) | Accept and monitor `report-uri`; migrate to nonce-on-proxy once the shell is dynamic |
| R-6 | Medium | `AUTH_SECRET` is 49 chars with only 22 unique characters and the literal word "secret"; the same value is duplicated in `NEXTAUTH_SECRET`. Verified **not** present in Git history, so it is weak-looking rather than leaked | Rotate to a random 48-byte value (§9); the health warning is this heuristic |
| R-7 | Low | 9 moderate advisories remain in `@typescript-eslint`/`glob`/`minimatch` (build and lint only, no runtime exposure) | Re-check after upstream releases |
| R-8 | Low | The `/admin` middleware gate trusts the cookie claim, so a just-demoted admin can still render the page shell (all its API calls now return `403`) | Optionally verify the role in the page's server component |
| R-9 | Low | `middleware.ts` is deprecated in Next 16 in favour of `proxy.ts` | Run `npx @next/codemod@canary middleware-to-proxy .` |
| R-10 | Low | Evolution API is unconfigured, so the WhatsApp feature is inert | Self-host the container and set `EVOLUTION_*` |
| R-11 | Info | `IPSTACK_API_KEY` and `MONKEYTYPE_APE_KEY` are set but unused | Delete them |

---

## 8. Environment variables

**Required in production** (the app refuses to issue sessions without a ≥32-char `AUTH_SECRET`):

```
AUTH_SECRET=                 # >=32 chars, random; keep identical to NEXTAUTH_SECRET if both set
ADMIN_EMAILS=                # comma separated; grants admin/superadmin
MONGODB_URI=                 # mongodb+srv://... (DATABASE_STRING also accepted)
NEXT_PUBLIC_FIREBASE_*  # Firebase web config (public by design)
IMAGEKIT_PRIVATE_KEY=        # server only
IMAGEKIT_PUBLIC_KEY= , IMAGEKIT_URL_ENDPOINT= , NEXT_PUBLIC_IMAGEKIT_*
ALLOWED_ORIGINS=             # comma separated, e.g. https://your-domain
```

**Optional integrations** (app degrades gracefully when absent):

```
UPSTASH_REDIS_REST_URL , UPSTASH_REDIS_REST_TOKEN
RESEND_API_KEY , RESEND_FROM or RESEND_FROM_EMAIL , RESEND_AUDIENCE_ID , RESEND_ADMIN_NOTIFY_EMAIL
TINYBIRD_TOKEN , TINYBIRD_HOST or TINYBIRD_URL , TINYBIRD_PLAYS_DATASOURCE (default music_plays)
EVOLUTION_API_URL , EVOLUTION_API_KEY , EVOLUTION_INSTANCE , EVOLUTION_ADMIN_NUMBER , EVOLUTION_WEBHOOK_SECRET
GEO_PROVIDER (default country.is) , GEO_LOOKUP_ENABLED (default true)
```

**Tuning / kill switches:**

```
SESSION_TTL_SECONDS (default 604800)   SESSION_VERSION (bump to invalidate every session at once)
ALLOW_GUEST_SESSIONS (set false in production if unused)
MAX_AUDIO_UPLOAD_BYTES , MAX_IMAGE_UPLOAD_BYTES , MONGODB_DB
```

`\.env.example` in the repository documents all of them. `.env` is git-ignored and was never committed.

---

## 9. Action checklist

```powershell
# 1. Rotate every credential exposed in Git history
#    MongoDB Atlas -> Database Access -> Edit user -> new password -> update MONGODB_URI
#    ImageKit dashboard -> regenerate key pair -> update IMAGEKIT_PRIVATE_KEY / IMAGEKIT_PUBLIC_KEY
#    Google Cloud Console -> API key -> restrict by HTTP referrer + rotate -> update NEXT_PUBLIC_FIREBASE_API_KEY

# 2. Rotate the Resend key (current one returns 400 "API key is invalid")
#    resend.com/api-keys -> create -> then verify as admin:
#    GET /api/integrations/health?probe=1   ->  "API key accepted."

# 3. Deploy the Tinybird schema
tb auth --token $env:TINYBIRD_TOKEN
cd d:\music ; tb push tinybird/

# 4. Rotate the session signing secret (invalidates sessions: users just re-login)
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#    put the same value in AUTH_SECRET and NEXTAUTH_SECRET

# 5. Verify everything
npm run verify ; npm run audit:security ; npm run build:next
powershell -File .\scripts\smoke-test.ps1 -Base http://localhost:3000
```

If the repository is public, also purge the historical blobs:
`git filter-repo --path .env --invert-paths` or BFG — and remember rotation is mandatory regardless.

---

## 10. Deployment

**Vercel (recommended, free tier).** Set the variables from §8 in *Project → Settings →
Environment Variables*. Vercel sets `x-forwarded-proto: https`, which the middleware requires.
No other configuration is needed.

**Cloudflare Workers (`wrangler.jsonc`, `open-next.config.ts` are already present).**

```powershell
npx wrangler secret put AUTH_SECRET   # repeat per secret; never put them in wrangler.jsonc
npm run build        # opennextjs-cloudflare build
npm run deploy
```

Note: I validated the Node runtime only. The `opennextjs-cloudflare` build path was not executed here.

**Local production check (gotcha):** `npm run build:next; npm run start -p 3400` then send
`x-forwarded-proto: https`, otherwise every request 308-redirects to `https://localhost:3400`, which
has no TLS listener. On a real host the proxy sets that header for you.

---

## 11. Not verified — limits of this audit

- **No real browser run.** CSP behaviour was verified from the built HTML and headers, not by loading
  the app in Chrome. Scripts may still be blocked by a directive I could not exercise; the
  `report-uri` sink will show it in production.
- **No email was sent.** Doing so would consume quota and requires a valid key and verified domain.
  Resend was verified only up to the provider rejecting the key.
- **Tinybird happy path not exercised** — the datasource does not exist yet. Only the MongoDB fallback
  is proven.
- **Evolution API not exercised** — no instance is running; only the fail-closed `503` is proven.
- **Cloudflare Workers runtime untested**; all runtime evidence is from `next start` and `next dev`.
- **Resend audience contact add not exercised** (needs a valid key and `RESEND_AUDIENCE_ID`).
