# Preproute — Test Management Application

Frontend test management application built with React and TypeScript for the Preproute Frontend Developer task evaluation.

Complete 5-page application: **Login → Dashboard → Create/Edit Test → Add Questions → Preview & Publish**

---

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:5173`

**Test Credentials:**

| Username       | Password    |
| -------------- | ----------- |
| `vedant-admin` | `vedant123` |

---

## API

Connects to staging backend: `https://admin-moderator-backend-staging.up.railway.app/api`

Uses JWT Bearer token authentication on all requests.

---

## Features

- Create, edit, delete questions
- Test scheduling and publishing
- View-only mode for published tests (`?mode=view`)
- Status tracking (draft, scheduled, live, expired)
- Dashboard with pagination and filtering
- Rich text editor with TipTap (formatting, image upload, base64 embedding)
- CSV bulk import with validation
- Responsive design
- JWT authentication
- Comprehensive error handling

---

## Tech Stack

**Frontend:** React 19 · TypeScript (strict) · Vite 8 · React Router 7

**Libraries:**
- TanStack Query v5 (state management & caching)
- TipTap (rich text editor)
- Multiselect (dropdown component)

**Styling:** Custom CSS (no UI framework)

---

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Dev server with HMR            |
| `npm run build`   | Production build               |
| `npm run lint`    | Run Oxlint                     |
| `npm run preview` | Preview production build       |
