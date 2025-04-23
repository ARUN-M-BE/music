# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

 1. Auth Improvements (Login / Verification Flow)
🔹 Goals:
Modify login logic

Add admin-side user verification

🛠️ Process:
Update backend auth flow (Node.js + MongoDB or similar):

Add isVerified or status field to user schema

Prevent login if user is not verified (admin must approve)

Add admin dashboard control:

Admin can view all pending users

Admin can "verify" users (toggle flag in DB)

✅ 2. Profile Page (User Side)
🔹 Goals:
Display all user details

Allow editing (email, username, profile pic, etc.)

🛠️ Process:
Create a Profile component in React

Fetch current user data from /api/user/me

Show editable fields (with validation)

Add update button → PUT /api/user/update

✅ 3. Favorite Songs Page
🔹 Goals:
Let users add/remove songs from favorites

Display them on a separate page

🛠️ Process:
Add favorites array to user model (list of song IDs)

On song cards, add a ❤️ button → toggle favorite

Create Favorites page

Fetch all songs where song._id is in user.favorites

✅ 4. Song Search + Filter Clear
🔹 Goals:
Search for songs by name, artist, etc.

Add “Clear Filter” button to reset all results

🛠️ Process:
In the search page:

Add input to search query

Fetch songs from /api/songs?query=...

Add "Clear Filter" button:

Clears input and reloads default song list

✅ 5. Admin: View + Edit Users
🔹 Goals:
Admin can select a user

View their profile

Update details (name, email, verification, etc.)

🛠️ Process:
Add admin route /admin/users

Show a list of users with a "View" button

Clicking it shows full user info (editable form)

Save changes via PUT /admin/user/:id

# client
```
└── 📁client
    └── 📁api
        └── index.js
    └── 📁public
        └── vite.svg
    └── 📁src
        └── App.css
        └── App.jsx
        └── 📁assets
            └── 📁image
                └── index.js
                └── logo.png
                └── user.png
            └── 📁others
                └── bg.mp4
                └── index.js
        └── 📁components
            └── Dashboard.jsx
            └── DashboardAlbum.jsx
            └── DashboardArtist.jsx
            └── DashboardHome.jsx
            └── DashboardSongs.jsx
            └── DashboardUsers copy.jsx
            └── DashboardUsers.jsx
            └── Header copy.jsx
            └── Header.jsx
            └── Home.jsx
            └── index.js
            └── Login.jsx
        └── 📁config
            └── firebase.config.js
        └── 📁context
            └── InitialState.js
            └── reducer.js
            └── StateProvider.jsx
        └── ErrorBoundary.jsx
        └── index.css
        └── main.jsx
        └── 📁utils
            └── style.js
    └── .env
    └── .gitignore
    └── eslint.config.js
    └── index.html
    └── package-lock.json
    └── package.json
    └── tailwind.config.js
    └── vite.config.js
```

# Server
```
└── 📁server
    └── 📁config
        └── firebase.config.js
        └── serviceAccountKey.json
    └── 📁models
        └── album.js
        └── artist.js
        └── song.js
        └── user.js
    └── 📁routes
        └── album.js
        └── artist.js
        └── auth.js
        └── song.js
    └── .env
    └── app.js
    └── mango.m
    └── mangodb.txt
    └── package-lock.json
    └── package.json
```
