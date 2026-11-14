# LESSONS.md — Music App Project Log

> Log project-specific mistakes and fixes here to prevent repetition.

## Date | Issue | Prevention Rule | Tag
2026-09-20 | Endless auth navigation loop in App.jsx | Never call `navigate("/")` inside `onAuthStateChanged` without route checks | Client/React
2026-09-20 | Redundant `index === index` in PlayListCard | Ensure list mapping checks target state index (e.g. `index === songIndex`) | Client/React
2026-09-20 | Deprecated Mongoose connection options | Omit `useNewUrlParser` and `useUnifiedTopology` in Mongoose 8.x | Server/MongoDB
2026-09-20 | Fixed width player overflow on mobile | Use responsive container utilities `w-full max-w-5xl px-4` instead of fixed `min-w-[700px]` | Client/UI
2026-09-20 | Unimported `validateUser` in `Login.jsx` | Always import API helper functions before calling them inside async auth handlers | Client/Auth
2026-09-20 | HTTP 505 error status in `auth.js` | Return standard HTTP 401/500 status codes for authentication errors | Server/Express
2026-09-20 | Vercel build failure on missing `./DashboardUsers copy` | Export valid component files and untrack `node_modules` from git repository | Build/Vercel
2026-09-20 | Vercel 404 NOT_FOUND on page refresh | Add SPA rewrites `source: "/(.*)", destination: "/index.html"` in `vercel.json` | Deployment/SPA
2026-11-13 | Server secrets were stored as plaintext in `.env`, `render.yaml` and `wrangler.jsonc` | Seal every credential (`enc:v1:` via `npm run secrets:seal`), keep only `SECRETS_MASTER_KEY` in the platform store, and never write a secret into a tracked file | Security/Secrets
2026-11-13 | A rejected Resend key only produced a `console.warn` and a discarded `false`, so email died unnoticed | Integration failures must be typed, logged at error level (throttled) and surfaced on a health endpoint; best-effort never means silent | Integrations/Resend
2026-11-13 | Git history held `.env`, `render.yaml` and a Google service-account key from the pre-Next layout | Run `npm run secrets:scan` (and `:history` after a layout change) before pushing; a CI scan is the only reliable guard | Security/Git
2026-11-14 | `MONGODB_DB` held a copy of the connection string, so every Mongo route answered 500 with "Database name ... is too long" | A database name is a short identifier (1-38 bytes): validate it and derive it from the URI instead of trusting a free-form env value | Server/MongoDB
2026-11-14 | Cloudflare built the app without `.env`, and `initializeApp()` at module scope threw `auth/invalid-api-key` while prerendering `/favorites` | Never initialise a browser SDK at import time; serve public config from a runtime route instead of relying on `NEXT_PUBLIC_*` build literals | Build/Deploy
2026-11-14 | Production answered `googleSignIn:false` while `.env` was fully configured | A deployment is configured only when the platform holds the values: check `/api/health`, then `npm run secrets:push -- --apply` | Deployment/Secrets
2026-11-14 | `opennextjs-cloudflare deploy` deploys the *existing* `.open-next` bundle (its help says "Deploy a built OpenNext app"), so an old bundle went live and a new route answered 404 | Build before deploying (`npm run deploy` now chains build + deploy) and confirm a new route exists in `.open-next/server-functions/default/.next/app-path-routes-manifest.json` | Deployment/Cloudflare
2026-11-14 | `wrangler secret bulk` failed with `Binding name 'ADMIN_EMAIL' already in use` (code 10053) | A binding name belongs to the `vars` block *or* to a secret, never both: skip names already shipped by `wrangler.jsonc` when pushing secrets | Deployment/Secrets
2026-11-14 | A sealed value without `SECRETS_MASTER_KEY` made every route (including `/api/health`) return an HTML 500, because `serverEnv` read secrets while the module was imported | Secret accessors must be getters; rate-limiting and email must degrade instead of throwing, so a misconfiguration surfaces as a JSON 503 that names the variable | Server/Config
