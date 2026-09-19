# LESSONS.md — Music App Project Log

> Log project-specific mistakes and fixes here to prevent repetition.

## Date | Issue | Prevention Rule | Tag
2026-09-20 | Endless auth navigation loop in App.jsx | Never call `navigate("/")` inside `onAuthStateChanged` without route checks | Client/React
2026-09-20 | Redundant `index === index` in PlayListCard | Ensure list mapping checks target state index (e.g. `index === songIndex`) | Client/React
2026-09-20 | Deprecated Mongoose connection options | Omit `useNewUrlParser` and `useUnifiedTopology` in Mongoose 8.x | Server/MongoDB
2026-09-20 | Fixed width player overflow on mobile | Use responsive container utilities `w-full max-w-5xl px-4` instead of fixed `min-w-[700px]` | Client/UI
2026-09-20 | Unimported `validateUser` in `Login.jsx` | Always import API helper functions before calling them inside async auth handlers | Client/Auth
2026-09-20 | HTTP 505 error status in `auth.js` | Return standard HTTP 401/500 status codes for authentication errors | Server/Express
