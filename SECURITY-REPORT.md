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
| Security tasks (27) | **20 fixed/verified**, **4 not applicable** (no password auth, no reset links, no payments), **3 requiring action from you** (credential rotation incl. a leaked Google service-account key, Resend key, Tinybird deploy) |
| Integrations | **4 working** (Upstash, Monkeytype, geo-IP, Tinybird token) · **1 blocked** (Resend: key invalid) · **1 not deployed** (Evolution API, self-hosted) |
| Paid services | **0** — IPstack was rejected, see §3 |
| Secrets at rest | **Implemented** — AES-256-GCM envelope encryption, key rotation, history scan, credential verifier (§12) |
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
   Re-probed in this pass with `npm run secrets:verify` (`GET /domains`, read-only) → **`401`**, same
   conclusion. `sendEmail()` therefore returns `ok:false` and logs a warning — welcome mail is silently not sent.
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
   documented in [`proxy.ts`](file:///d:/music/src/proxy.ts).
7. **MongoDB connection race (fixed).** Connect-then-disconnect per operation caused
   `MongoNotConnectedError` under concurrent requests (`GET /api/auth/session` → 500). Replaced with a
   single de-duplicated connect promise, a ref-counted active-operation counter, retry-once on
   connection errors and a 30 s idle disconnect. Reproduced, fixed, retested → 200.
8. **`xlsx` supply-chain risk (removed).** `npm audit` reported unpatched prototype-pollution/ReDoS
   advisories with no fixed version. Replaced with `read-excel-file` for reading and a
   dependency-free CSV/JSON path for export; `.xls` is now rejected with a clear message.
9. **Google sign-in was broken on every deployment (fixed, proven).** The browser completed the
   popup but the server answered *"Google sign-in is not configured on this deployment"*.
   [`env.ts`](file:///d:/music/src/lib/env.ts) read the value through `readEnv("NEXT_PUBLIC_…")`, i.e.
   `process.env[name]` with a **dynamic** key. A bundler can only inline the *literal* form
   `process.env.NEXT_PUBLIC_X`, so the server bundle kept the lookup and resolved it to nothing at
   runtime, while the client (a literal read in `firebase.ts`) had the key and opened the popup fine.
   `NEXT_PUBLIC_*` values are now read as literal constants and fall back to their server-side
   equivalents. Proof: with `NEXT_PUBLIC_FIREBASE_API_KEY` and `…_PROJECT_ID` **blanked in the
   process environment** at runtime, `/api/health` still reports `googleSignIn: true` (the value is
   baked in), a bogus-but-schema-valid token now reaches Google and returns *"Identity token was
   rejected"* instead of the config error, and the key appears in the server chunks
   (`/.next/server/chunks/7783.js`, `.open-next/…/handler.mjs`) rather than as an unresolved lookup.
10. **Live MongoDB credential committed in plaintext (removed from the tree; rotation still required).**
    [`wrangler.jsonc`](file:///d:/music/wrangler.jsonc) shipped a full Atlas connection string — with the
    password — twice, inside `vars`, and that file is tracked and pushed to `origin/next-ts`. The
    repository is public-facing, so this is a live credential exposure regardless of remediation.
    The entry is now removed (only the non-secret `ADMIN_EMAIL` remains) with a comment pointing at
    `npx wrangler secret put MONGODB_URI`. **The password must be rotated — see R-1.** The same value
    also sits in the gitignored `.env`, so the rotation has to update that file too.
11. **Every server secret was stored in plaintext (fixed).** `.env`, `.dev.vars` and every deploy
    target held `MONGODB_URI`, `IMAGEKIT_PRIVATE_KEY`, `RESEND_API_KEY`, `TINYBIRD_TOKEN`, the Upstash
    token and `AUTH_SECRET` as readable strings, so any copy of the environment (a screenshot, a support
    bundle, a build directory, `.open-next/server-functions/default/.env` — see R-13) disclosed all of
    them at once. They can now be stored as `enc:v1:<keyId>:<ciphertext>` and are decrypted only in the
    server process ([`secrets.ts`](file:///d:/music/src/lib/secrets.ts),
    [`secrets-core.mjs`](file:///d:/music/src/lib/secrets-core.mjs)). `/api/health` reports which
    secrets are still plaintext, and `SECRETS_STRICT=true` turns that into a hard failure. The design,
    the rotation procedure and the tests are in §12.
12. **Resend failures were silent (fixed).** The rejected key produced one `console.warn` per attempt
    and a `false` return value that every caller discarded, so nobody learned that welcome email had
    stopped. [`resend.ts`](file:///d:/music/src/lib/integrations/resend.ts) now returns a typed
    `ResendResult`, classifies the failure (`unauthorized`, `rate_limited`, `provider_error`, `network`),
    logs a key rejection as an **error** (throttled to once per 5 minutes), exposes the last failure via
    `getResendDiagnostics()` in `/api/health`, and offers `checkResendKey()` — a read-only `GET /domains`
    probe used by `/api/integrations/health?probe=1`. It also flags a key that does not match the `re_…`
    shape *before* spending a request on it.
13. **Git history contains a fourth credential family (newly found).** The automated history scan found
    a committed **Google service-account private key** (`server/config/serviceAccountKey.json`, commit
    `3549ee9`), plus private-key blocks and a MongoDB URI in `server/mangodb.txt` and `server/mango.m`
    (commit `ba530d1`), and Mongo/ImageKit/Firebase values in `server/.env`, `client/.env`,
    `render.yaml` and `server/render.yaml`. Two facts follow and both are recorded in R-1: the earlier
    statement that `.env` was *never* committed is wrong for the pre-Next layout, and the service-account
    key must be **revoked in Google Cloud IAM**, not merely "rotated".

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
| Build (Workers) | `npm run build` (`opennextjs-cloudflare build`) | **pass** — `Bundling Node.js middleware…`, worker written to `.open-next/worker.js` |
| Headers on Workers | `wrangler dev` + `GET /login` | full set present: CSP, HSTS, COOP/CORP, Permissions-Policy, `nosniff`, `DENY` |
| Worker gate | `wrangler dev` + `GET /admin` / `GET /api/health` | `307` → `/login`, and `200` with `checks.googleSignIn: true` |
| Public-key inlining | scan of `.next/` and `.open-next/` for the `.env` value | present in server chunks; `AUTH_SECRET` present in **0** client files |
| Secrets crypto | `npm run secrets:test` | **pass** — seal→open round trip, rotation reads old+new ciphertext, wrong key rejected, tampered ciphertext rejected by AES-GCM, plaintext not mistaken for a token, sealed value without a key fails closed |
| CLI ↔ runtime interop | `secrets.mjs encrypt` → `readSecret()` in `src/lib/secrets.ts` | decrypted to the exact input; report `{keyId, decryptedReads:1, selfTest:true}` |
| Working-tree secret scan | `npm run secrets:scan` | **0 secrets in 125 tracked/untracked files** (documented placeholders in `.env.example` ignored) |
| History secret scan | `npm run secrets:scan:history` | **27 occurrences in 8 paths** — see R-1 |
| Secret inventory | `npm run secrets:doctor -- --env .env` | 8 plaintext, 3 unset, 0 broken — matches the file |
| Sealing (fixture) | `seal --env tmp/secrets-fixture.env --in-place` | 3 sealed, quoting preserved, `NEXT_PUBLIC_*`/non-secret values untouched, backup written |
| Sealed secret in production | `next start` with a sealed `MONGODB_URI` and only `SECRETS_MASTER_KEY` in the environment | `/api/health` → `secrets {atRestEncryption:true, selfTest:true, decrypted:1, failed:[]}` and `database:"down"` (it dialled the decrypted host) instead of `"unconfigured"` |
| Sealed secret without its key | `next start` with a sealed `MONGODB_URI` and **no** `SECRETS_MASTER_KEY` | `secrets.failed:["MONGODB_URI"]`, `errors` names the variable and the key to set, health still answers instead of a 500 — fails closed, not open |
| Credential verifier | `npm run secrets:verify` | MongoDB `ping=1` · ImageKit `200` · Firebase key accepted · Upstash `200` · Tinybird `200` · **Resend `401` (R-2 reproduced)** |
| Resend diagnostics | `/api/health → email` | `keyFormatValid:true` for the live `re_…` key (a stricter regex produced a false negative and was fixed); `sandboxSender:true` yields the delivery warning |

The 25 smoke assertions cover: five unauthenticated `401`s, admin redirect, guest session creation,
cookie `HttpOnly`/`SameSite`/signature, authenticated session read, member `403` on three admin
routes, forged-cookie rejection, header impersonation (`x-user-email`, `Bearer <email>`), CORS
`403` on POST and preflight, search sanitisation, invalid id `400`, `429` after the limit, health
`200`, and the CSP report sink `204`.

---

## 7. Remaining risks

| ID | Severity | Issue | Action |
| --- | --- | --- | --- |
| R-1 | **High** | Credentials are readable in Git history and cannot be rotated from this machine. Verified with `npm run secrets:scan:history`: MongoDB URIs in `src/lib/mongodb.ts`, `wrangler.jsonc`, `server/.env`, `render.yaml`, `server/render.yaml`, `server/mango.m`; ImageKit key pair in `src/lib/imagekit.ts`, `client/.env`, both `render.yaml` files; Firebase web key in `src/lib/firebase.ts`, `client/.env`; **Google service-account private key** in `server/config/serviceAccountKey.json` and `server/mangodb.txt` | Rotate in this order: (1) **revoke** the service-account key in Google Cloud IAM — it grants project access regardless of any password, (2) Atlas user password, (3) ImageKit key pair, (4) restrict **and** rotate the Firebase web key (HTTP-referrer + API restriction). Then `npm run secrets:verify` must pass and `npm run secrets:seal -- --in-place` stores the new values sealed. History rewriting removes the copy only; it does not un-leak |
| R-2 | **High** | The Resend API key is rejected by the provider, so transactional email fails | **No longer silent**: typed failure, throttled `console.error`, `/api/health → email.lastFailure`, a read-only probe in `/api/integrations/health?probe=1`, and a `re_…` format check made before the request. The key itself still needs rotating — `npm run secrets:verify` prints `Resend  key rejected (HTTP 401/403)` until it is |
| R-3 | Medium | `onboarding@resend.dev` only delivers to your own account address; `RESEND_AUDIENCE_ID` unset | Verify a domain, set the sender, create an audience |
| R-4 | Medium | Tinybird datasource not deployed — analytics lands in MongoDB | `tb push tinybird/` (§2.3) |
| R-5 | Medium | CSP uses `'unsafe-inline'` for scripts (a nonce is impossible on the prerendered shell) | Accept and monitor `report-uri`; migrate to nonce-on-proxy once the shell is dynamic |
| R-6 | Medium | `AUTH_SECRET` is 49 chars with only 22 unique characters and the literal word "secret"; the same value is duplicated in `NEXTAUTH_SECRET`. Verified **not** present in Git history, so it is weak-looking rather than leaked | Rotate to a random 48-byte value (§9); the health warning is this heuristic |
| R-7 | Low | 9 moderate advisories remain in `@typescript-eslint`/`glob`/`minimatch` (build and lint only, no runtime exposure) | Re-check after upstream releases |
| R-8 | Low | The `/admin` middleware gate trusts the cookie claim, so a just-demoted admin can still render the page shell (all its API calls now return `403`) | Optionally verify the role in the page's server component |
| R-9 | Resolved | `middleware.ts` (deprecated in Next 16) migrated to `proxy.ts` | Keep the exported name `proxy` and never add `runtime` to its `config` — a proxy is Node-runtime only |
| R-10 | Low | Evolution API is unconfigured, so the WhatsApp feature is inert | Self-host the container and set `EVOLUTION_*` |
| R-11 | Info | `IPSTACK_API_KEY` and `MONKEYTYPE_APE_KEY` are set but unused | Delete them |
| R-12 | Low | On Cloudflare, `proxy.ts` relies on OpenNext's **experimental** Node.js middleware support (`WARN Node.js middleware support is experimental…`). Verified working today via `wrangler dev`, but it is not covered by OpenNext's maintenance | Re-run the header/gate checks after upgrading `@opennextjs/cloudflare`; the same checks are in the test table above |
| R-13 | Low | `opennextjs-cloudflare build` copies `.env` into `.open-next/server-functions/default/.env`, so the deploy **directory** holds every secret. `handler.mjs` does not reference it, so Wrangler does not upload it, and `.open-next/` is gitignored | Never publish `.open-next/` as a raw artifact or zip; build in CI with injected environment variables instead of a `.env` file. Sealed values reduce the blast radius to ciphertext without the master key |
| R-14 | Medium | The new `Secret scan` workflow fails on this repository until the historical blobs are purged, because the history job scans every commit | Intended: the red check is the reminder that R-1 is still open. Purge with `git filter-repo`/BFG after rotation, then the scheduled run goes green |

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

**Secrets at rest** (recommended; see §12):

```
SECRETS_MASTER_KEY=          # 32-byte base64url key; enables enc:v1: values
SECRETS_MASTER_KEY_PREVIOUS= # only during a master-key rotation
SECRETS_STRICT=false         # true = refuse plaintext secrets outright
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
# 1. Rotate every credential exposed in Git history (R-1). Order matters.
#    1a. Google Cloud IAM -> Service Accounts -> Keys: DELETE the key that was
#        in server/config/serviceAccountKey.json (revoking beats rotating here).
#    1b. MongoDB Atlas -> Database Access -> Edit user -> new password.
#    1c. ImageKit dashboard -> regenerate the key pair.
#    1d. Google Cloud Console -> API key -> add an HTTP-referrer restriction, then rotate.
#    Put the results in .env only, then prove them:
npm run secrets:verify            # expects every configured credential [OK]

# 2. Rotate the Resend key (R-2: the current one returns 401/403)
#    resend.com/api-keys -> create -> RESEND_API_KEY=re_...
npm run secrets:verify            # Resend must print [OK]  key accepted

# 3. Turn on encryption at rest and seal the new values
npm run secrets:keygen                              # prints SECRETS_MASTER_KEY
npx wrangler secret put SECRETS_MASTER_KEY          # platform store, never git
$env:SECRETS_MASTER_KEY = "<the key>"
npm run secrets:seal -- --in-place                  # writes .env.bak.<timestamp>
npm run secrets:doctor                              # expect 0 plaintext, 0 broken
npm run secrets:scan                                # expect 0 findings
#    after a successful deploy set SECRETS_STRICT=true to keep it that way

# 4. Deploy the Tinybird schema
#    tb auth --token $env:TINYBIRD_TOKEN ; tb push tinybird/

# 5. Rotate the session signing secret (invalidates sessions: users just re-login)
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#    put the same value in AUTH_SECRET and NEXTAUTH_SECRET, then re-run step 3

# 6. Verify everything
npm run verify ; npm run secrets:test ; npm run build:next
powershell -File .\scripts\smoke-test.ps1 -Base http://localhost:3000
#    curl https://your-domain/api/health
#      -> secrets.selfTest=true, secrets.plaintext=[], email.lastFailure=null
#    curl -H "Authorization: Bearer <admin>" "/api/integrations/health?probe=1"
#      -> resend-audiences: "API key accepted."
```

If the repository is public, purge the historical blobs once rotation is done:
`git filter-repo --path server/.env --path client/.env --path render.yaml --invert-paths`
or BFG, then force-push and have every collaborator re-clone. Rotation is mandatory
regardless: rewriting history removes a copy, it does not un-leak a credential.

---

## 10. Deployment

**Vercel (recommended, free tier).** Set the variables from §8 in *Project → Settings →
Environment Variables*. Vercel sets `x-forwarded-proto: https`, which the proxy requires.
No other configuration is needed. `vercel.json` is intentionally `{}`: it previously held a
catch-all rewrite to `/index.html`, which does not exist in an App Router build and would have
broken every route.

> Any change to a `NEXT_PUBLIC_*` variable requires a **new build** — those values are compiled into
the bundle. Editing the environment on a running deployment changes nothing, which is exactly how
the Google sign-in outage happened.

**Cloudflare Workers (`wrangler.jsonc`, `open-next.config.ts` are already present).**

```powershell
# Secrets are never written to wrangler.jsonc - only non-secret values live there.
npx wrangler secret put AUTH_SECRET
npx wrangler secret put MONGODB_URI
npx wrangler secret put IMAGEKIT_PRIVATE_KEY
npx wrangler secret put UPSTASH_REDIS_REST_URL     # repeat per secret
npm run build        # opennextjs-cloudflare build
npm run deploy
```

Both build targets were executed. `npm run build` reaches `OpenNext build complete` and writes
`.open-next/worker.js`; the worker was then run locally with `npx wrangler dev`, where the full
header set, the `/admin` → `/login` gate and `/api/health` all behaved exactly as under `next start`.
The only caveat is OpenNext's own warning that Node.js middleware support on Workers is
experimental — recorded as R-12, with the checks to re-run after an upgrade.

**Workers Builds specifics (learned from a failed CI deploy).**

- `name` in [`wrangler.jsonc`](file:///d:/music/wrangler.jsonc) must equal the Worker the Builds
  project is connected to (`music`). When they differ the CI silently overrides the name and the
  version upload failed with `code: 10013` on `/workers/scripts/music/versions`. It is now aligned.
- Upload size is well inside the free plan: **9,707.94 KiB raw / 1,913.61 KiB gzip** against a 3 MiB
  compressed limit, measured with `npx wrangler deploy --dry-run`. Size is therefore *not* the cause
  of a `10013`; that code is an API-side 500 during the versions/assets session, so a re-run is the
  first response and a config check the second.
- `--dry-run` validates the whole config without touching the account — run it before any deploy.
- `wrangler dev` and `deploy --dry-run` write scratch output to `tmp/` / the `--outdir`; both are now
  git-ignored and excluded from ESLint (`ignores`), because linting generated bundles produced ~9.5k
  bogus problems.

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
- **Cloudflare Workers runtime verified locally, not deployed.** The build succeeds and `wrangler dev`
  reproduces the Node behaviour (headers, admin gate, health), but no real deploy was performed, so
  edge-specific behaviour (streaming, cache, cold starts) is still unproven. OpenNext flags Node
  middleware on Workers as experimental (R-12).
- **Resend audience contact add not exercised** (needs a valid key and `RESEND_AUDIENCE_ID`).
- **No third-party credential was actually rotated.** That needs console access to Google Cloud IAM,
  Atlas, ImageKit and Resend, which this machine does not have. What was built is the proof step:
  `npm run secrets:verify` performs a real (read-only) authenticated call per provider, so a rotation
  is either confirmed or rejected with the provider's own status code.
- **The encryption path was exercised under Node.js only** — the runtime of `next build`, `next start`
  and the CLI. On Workers it relies on `node:crypto` (AES-256-GCM, HMAC, `randomBytes`), which
  `nodejs_compat` provides, but no deploy was performed. `/api/health` reports `secrets.selfTest`, so a
  runtime without those primitives fails visibly instead of silently accepting an unreadable secret.

---

## 12. Secrets at rest, rotation and verification

### 12.1 Why encryption at rest

A Git-ignored `.env` protects a secret from `git push` and from nothing else. The same value is copied
into the deploy directory (R-13), pasted into a terminal, attached to a support thread and printed by a
SIGSEGV handler. Encrypting the value means a copy of the environment discloses ciphertext unless the
attacker also holds the master key, which lives in the platform secret store.

### 12.2 Format

```
enc:v1:<keyId>:<base64url(iv || ciphertext || authTag)>
```

| Part | Size | Purpose |
| --- | --- | --- |
| `keyId` | 8 chars | `hmac-sha256(master, "good-music/secrets/v1")` prefix; lets a rotation carry two keys and still select the right one |
| `iv` | 12 bytes | random per value (verified: sealing the same plaintext twice yields different tokens) |
| `authTag` | 16 bytes | AES-GCM authentication; a flipped byte is rejected, not decrypted to garbage |

Master key: 32 random bytes, base64url (also accepts base64/hex). It is used directly as the AES key and
never derived on the fly, so only `createCipheriv` / `createDecipheriv` / `createHmac` / `randomBytes`
are needed — the subset that exists in both Node.js and the Workers `node:crypto` shim.

### 12.3 Runtime

[`secrets-core.mjs`](file:///d:/music/src/lib/secrets-core.mjs) is plain ESM and is imported by **both**
the server ([`secrets.ts`](file:///d:/music/src/lib/secrets.ts)) and the CLI
([`secrets.mjs`](file:///d:/music/scripts/secrets.mjs)). One implementation, so a value sealed by the CLI
cannot fail to open in the app. `serverEnv` in [`env.ts`](file:///d:/music/src/lib/env.ts) reads every
server secret through `readSecret()`:

| Situation | Behaviour |
| --- | --- |
| sealed, key present | decrypted, cached for the isolate |
| sealed, key missing/wrong | throws naming the **variable**, never the value or the ciphertext |
| plaintext | accepted, recorded in `secrets.plaintext[]`, warned about by `validateServerEnv` |
| plaintext + `SECRETS_STRICT=true` | throws: the deployment refuses to run on a weak configuration |

`NEXT_PUBLIC_*` values are the deliberate exception: they are inlined into the browser bundle at build
time and can never be ciphertext. The Firebase **web** API key is public by design and is protected by
HTTP-referrer/API restrictions, not by secrecy — that is why R-1 asks for a restriction *and* a rotation.

### 12.4 Operator commands

| Command | What it does |
| --- | --- |
| `npm run secrets:keygen` | prints a new `SECRETS_MASTER_KEY` and its key id |
| `npm run secrets:seal -- --in-place` | seals every plaintext secret in `.env`; writes `.env.bak.<ts>` first |
| `npm run secrets:rekey` | re-seals every `enc:v1:` value under a new key (rotation window) |
| `npm run secrets:doctor` | per-variable state: sealed / plaintext / missing / **broken** |
| `npm run secrets:verify` | real authenticated probe per provider (MongoDB ping, ImageKit list, Resend domains, Firebase lookup, Upstash ping, Tinybird datasources) |
| `npm run secrets:scan` | fails if a credential pattern appears in any tracked/untracked file |
| `npm run secrets:scan:history` | streams `git log -p --all` and reports commit + path + rule (never the value) |
| `npm run secrets:test` | crypto self-test: round trip, rotation, wrong key, tamper, plaintext, missing key |

Exit codes are meaningful: `scan` and `verify` return `1` on a finding, so they gate CI
([`.github/workflows/secret-scan.yml`](file:///d:/music/.github/workflows/secret-scan.yml)) without extra
glue. The scan is dependency-free and runs in seconds.

### 12.5 Rotating the master key without downtime

1. `npm run secrets:rekey` — every value is re-sealed under the new key (`.env.rekeyed` by default).
2. Deploy the new key as `SECRETS_MASTER_KEY` **and** keep the old one as
   `SECRETS_MASTER_KEY_PREVIOUS`; both the old and the new ciphertext now open, so in-flight instances
   and the new one coexist.
3. Confirm `GET /api/health` → `secrets.selfTest: true` and `secrets.failed: []`.
4. Remove `SECRETS_MASTER_KEY_PREVIOUS` and deploy again.

### 12.6 What this does **not** do

- It does not rotate a third-party credential. Only the provider can invalidate an Atlas password, an
  ImageKit key or a Google API key; `npm run secrets:verify` tells you whether the new one works.
- It does not un-leak anything already pushed. Rotation does. History rewriting (R-14) only removes a
  copy.
- It does not protect a secret that is pasted into a URL, a log line or an error object. The code path
  here never logs a value, and `redact()` in the CLI scrubs provider tokens from upstream error text.
