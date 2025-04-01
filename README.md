# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

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