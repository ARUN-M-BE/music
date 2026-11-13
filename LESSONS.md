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
