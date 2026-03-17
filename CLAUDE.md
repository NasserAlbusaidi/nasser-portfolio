# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sci-fi themed Ironman training portfolio built with React 19, Vite 7, and Tailwind CSS. Integrates Intervals.icu (training data), Firebase/Firestore (auth, database, hosting), Mapbox GL (3D globe visualization), and Recharts (analytics). Uses a CRT/cyberpunk aesthetic with neon-orange (#FF5F00), neon-green (#00FF41), and cyber-yellow (#FFD300) as the core palette.

## Commands

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build (output: `dist/`)
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint

No test framework is configured.

## Architecture

**Entry flow**: `index.html` → `src/main.jsx` → `src/App.jsx` (Firebase init, Firestore listeners, layout)

**State management**: Zustand store (`src/store/useStore.js`) handles auth state, data (portfolioItems, trainingLogs, wellnessLogs), UI state, and modal state. Single store with flat structure.

**Notifications**: React Context (`src/contexts/NotificationContext.jsx`) provides a toast notification system.

**Data sources**:
- Firestore collections: `garage_items`, `ironman_logs`, `daily_wellness` — real-time via `onSnapshot()`
- Intervals.icu API (`src/api/intervals.js`) — training activities and wellness data
- Mapbox GL — 3D globe with activity paths from `public/mission_paths.json`

**Sections** (`src/components/sections/`):
- `Analytics.jsx` — Training dashboard with heatmap, bio monitor, charts, race predictor
- `Garage.jsx` — Photography gallery with EXIF extraction and Firestore CRUD
- `GlobalOps.jsx` — Interactive Mapbox 3D globe showing activity routes
- `Roadmap.jsx` — Ironman training timeline

**Key component groups**:
- `src/components/analytics/` — Data visualization (Recharts-based)
- `src/components/modals/` — PIN pad, image viewer, upload, edit, sync modals
- `src/components/effects/ParticleBackground.jsx` — TSParticles animated background
- `src/components/BootSequence.jsx` — Cinematic startup animation (Framer Motion)
- `src/components/TacticalHUD.jsx` — Top HUD overlay with stress/countdown

**Backend scripts** (`scripts/`):
- `sync.js` — Intervals.icu → Firestore activity sync (runs via GitHub Actions 4x daily)
- `map-sync.js` — Activity map coordinate cache sync
- These scripts use `firebase-admin` with `service-account.json`

## Environment Variables

All client-side env vars use the `VITE_` prefix. See `.env.example` for the full list. Key groups:
- `VITE_FIREBASE_*` — Firebase project config
- `VITE_INTERVALS_*` — Intervals.icu API credentials
- `VITE_MAPBOX_ACCESS_TOKEN` — Mapbox GL token
- `VITE_ACCESS_PIN` — Admin console PIN
- `VITE_IRONMAN_DATE` / `VITE_TARGET_*` — Training targets

## Deployment

Firebase Hosting deploys from `dist/`. SPA routing rewrites all paths to `/index.html`.
- PR merges to `main` trigger auto-deploy (`.github/workflows/firebase-hosting-merge.yml`)
- PRs get preview URLs (`.github/workflows/firebase-hosting-pull-request.yml`)

## Style Conventions

- Monospace typography (Courier New) throughout
- CRT scanlines and static noise overlays defined in `src/index.css`
- Tailwind with custom theme extensions in `tailwind.config.js`
- Framer Motion for component animations
- ESLint flat config with React Hooks and React Refresh plugins
