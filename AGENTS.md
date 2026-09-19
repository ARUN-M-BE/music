# Music Web Application — Project Rules

## Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, Vite, Tailwind CSS, Framer Motion, React Router DOM | React 19, Vite 6, Tailwind v4, Router v7 |
| **Backend** | Node.js, Express, MongoDB (Mongoose), Firebase Admin | Express 4.21, Mongoose 8.12, Node 22 |
| **Storage & Auth** | ImageKit (Audio/Images), Firebase Auth | ImageKit v6, Firebase v11 |
| **Services** | Nodemailer (Emails), Multer (File uploads) | Multer 1.4, Nodemailer 6.10 |

## Active Agents & Workflows
- `frontend-architect-agent`: UI polish, responsive design, audio player enhancements, player controls.
- `backend-engineer-agent`: REST API routes, audio upload stream handling, MongoDB aggregation.
- `database-administrator-agent`: MongoDB index optimization, schema validation, connection pooling.
- `bug-resolver-agent`: Diagnostics, runtime crashes, audio playback edge cases, error handling.
- `security-auditor-agent`: Secure audio streaming CORS, token verification, input sanitization.
- `token-optimizer-agent`: Low-token targeted file edits and diff generation.

## Project Structure
```
music/
├── client/           # React 19 + Vite + Tailwind v4 Frontend
│   ├── src/
│   │   ├── components/ # Player, Sidebar, Header, Song Card, Album Card
│   │   ├── pages/      # Home, Search, Library, Playlist, Artist, Settings
│   │   └── api/        # Axios API client instances
└── server/           # Express + Mongoose + ImageKit Backend
    ├── models/       # Song, Album, User, Playlist schemas
    ├── routes/       # Auth, Song, Album, User, Streaming routes
    └── config/       # DB connection, ImageKit, Firebase config
```
