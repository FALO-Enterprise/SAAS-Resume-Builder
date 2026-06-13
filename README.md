# ResuMax — Trusted. Global. Effortless.

A premium SaaS Resume Builder landing page built with Next.js 15, Tailwind CSS v4, Three.js, and Framer Motion.

## Tech Stack

- **Next.js 15** (App Router)
- **Tailwind CSS v4**
- **Three.js** — Interactive particle field background
- **Framer Motion** — Scroll-triggered animations
- **next-intl** — Arabic & English i18n with RTL/LTR support

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it auto-redirects to `/en`.

## Language Switching

- English: `http://localhost:3000/en`
- Arabic (RTL): `http://localhost:3000/ar`

## Project Structure

```
resumax/
├── app/
│   ├── [locale]/         # Locale-aware routes
│   │   ├── layout.tsx    # HTML with lang/dir attrs
│   │   └── page.tsx      # Landing page
│   └── globals.css       # Design system + Tailwind
├── components/
│   ├── 3d/               # Three.js particle field
│   ├── sections/         # All landing page sections
│   └── ui/               # Navbar, Footer, SectionLabel
├── i18n/
│   ├── routing.ts        # Locale routing config
│   └── request.ts        # next-intl request config
├── messages/
│   ├── en.json           # English translations
│   └── ar.json           # Arabic translations
└── middleware.ts         # i18n middleware
```

## Sections

1. **Hero** — Animated 3D particle bg, floating resume mockup, stats
2. **Challenge** — 4 pain points with hover effects
3. **Features** — 2×3 card grid with colored accents
4. **How It Works** — 4-step process with connecting timeline
5. **Global Principles** — 5 standards + regional support
6. **Roadmap** — v1.0 → v3.0 timeline
7. **Testimonials** — 3 testimonials from global users
8. **CTA** — Bold close with animated rings
9. **Footer** — Full links + social icons

## Next Steps (Backend Integration)

- Connect `/api/auth` for Sign In / Sign Up
- Connect `/api/resumes` for CRUD operations
- Add Stripe for `/api/billing`
- Add database (PostgreSQL + Prisma recommended)

---

Powered by **FALO Enterprise**
