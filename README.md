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

Express API under `apps/backend/src`, organized by module (`auth`, `resume`, `template`, `users`), each with its own controller/service/repository/schema. Database access is via Prisma (`apps/backend/src/prisma/schema.prisma`).

### Resume PDF export

PDF export uses Puppeteer's managed Chromium and the same React template as the browser preview. The existing `FRONTEND_URL` and `BACKEND_PUBLIC_URL` settings are used by the restricted internal render flow. Optional deployment settings are:

```dotenv
# Backend
PDF_CONCURRENCY=2
PDF_TIMEOUT_MS=30000
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome

# Frontend (only when its server reaches the API at a different internal URL)
BACKEND_INTERNAL_URL=http://backend:3001
```

Run `npm run seed --workspace apps/backend` when provisioning a database so the stable `minimal` / Professional ATS template metadata is present.

### AI resume enhancement with Google Gemini

The dashboard Generate action uses the authenticated backend to improve the professional title, experience descriptions, and skills before opening the preview. Configure the server only; never expose this key through a `NEXT_PUBLIC_` variable:

```dotenv
GEMINI_API_KEY=your-gemini-api-key
# Optional; defaults to the stable Gemini 3.6 Flash model
GEMINI_MODEL=gemini-3.6-flash
```

Google's standard `GOOGLE_API_KEY` variable is also accepted, but `GEMINI_API_KEY` is preferred.

### Password-reset email configuration

The password-reset flow uses the backend SMTP settings and builds links to the
frontend application. Add these values to `apps/backend/.env`:

```dotenv
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
EMAIL_FROM="ResuMax <no-reply@example.com>"
```

Apply pending migrations before using the flow:

```bash
npm exec --workspace apps/backend -- prisma migrate deploy
```

When SMTP is not configured in development, the reset link is printed in the
backend console instead of being emailed.

### Google, GitHub, and LinkedIn sign-in

Social sign-in uses each provider's OAuth authorization-code flow. Copy the
example environment files and configure these backend variables:

```dotenv
FRONTEND_URL=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:3001

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

Register these exact callback URLs in the provider dashboards:

```text
http://localhost:3001/api/auth/oauth/google/callback
http://localhost:3001/api/auth/oauth/github/callback
http://localhost:3001/api/auth/oauth/linkedin/callback
```

For a deployed app, replace the origin with the public HTTPS backend URL.
LinkedIn may require an HTTPS tunnel even during local provider testing. Enable
LinkedIn's **Sign In with LinkedIn using OpenID Connect** product so the app can
request the `openid profile email` scopes.

Apply the OAuth account migration and regenerate Prisma Client:

```bash
npm exec --workspace apps/backend -- prisma migrate deploy
npm exec --workspace apps/backend -- prisma generate
```

The frontend can override its backend origin with
`NEXT_PUBLIC_BACKEND_URL` as shown in `apps/frontend/.env.example`.

---

Powered by **FALO Enterprise**
