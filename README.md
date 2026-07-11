# ResuMax

A premium SaaS resume builder — Next.js frontend, Express/Prisma backend, structured as an npm-workspaces monorepo orchestrated with Turbo.

## Structure

```
resumax/
├── apps/
│   ├── frontend/          # Next.js app (App Router, Tailwind v4, next-intl, Three.js)
│   └── backend/           # Express API (Prisma + PostgreSQL, JWT auth)
├── packages/
│   ├── shared-types/      # @resumax/shared-types — DTOs/interfaces shared across apps
│   └── shared-utils/      # @resumax/shared-utils — shared utility functions
├── package.json           # root workspace config
└── turbo.json             # Turbo task pipeline (build/dev/lint/type-check)
```

Frontend and backend are independent runtimes — the frontend never imports backend code directly, only `@resumax/shared-types` and `@resumax/shared-utils`, and talks to the API over HTTP.

## Getting started

```bash
npm install         # installs and links all workspaces
npm run dev          # starts frontend + backend concurrently
```

- Frontend: http://localhost:3000 (auto-redirects to `/en`; also serves `/ar` for RTL)
- Backend: see `apps/backend` for its configured port

The backend needs a `.env` in `apps/backend` (Prisma `DATABASE_URL`, JWT secret, etc.) — not committed, create it locally before `npm run dev` will fully work end-to-end.

## Commands

All root scripts run through Turbo, which caches per-workspace and only rebuilds what changed:

```bash
npm run dev          # turbo run dev     — all apps, watch mode
npm run build        # turbo run build   — all apps + packages
npm run lint          # turbo run lint
npm run type-check    # turbo run type-check
npm run clean         # remove all node_modules
npm run format        # prettier --write across the repo
```

Run a single workspace directly:

```bash
npm run frontend                              # frontend dev server only
npm run backend                               # backend dev server only
npm --workspace apps/frontend run build
npm --workspace apps/backend run type-check
npm --workspace @resumax/shared-types run build
```

## Frontend

Next.js App Router app under `apps/frontend/app/[locale]`. Landing page sections live in `apps/frontend/components/sections`, shared UI in `apps/frontend/components/ui`. i18n (English/Arabic, RTL-aware) is configured in `apps/frontend/i18n` with translations in `apps/frontend/messages`.

## Backend

Express API under `apps/backend/src`, organized by module (`auth`, `resume`, `template`, `users`), each with its own controller/service/repository/schema. Database access is via Prisma (`apps/backend/prisma/schema.prisma`).

---

Powered by **FALO Enterprise**
