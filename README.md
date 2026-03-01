# Racquet Stringing Management System 🎾

A bilingual (Hebrew/English) web application for managing racquet stringing services. Built for a stringing business in Israel — clients book online, stringers manage jobs via an internal dashboard.

**Live:** Deployed on [Vercel](https://vercel.com)

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Server Actions) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | [Turso](https://turso.tech) (LibSQL — cloud-hosted SQLite) |
| **ORM** | [Prisma](https://www.prisma.io) v5 with `driverAdapters` preview |
| **Auth** | Cookie-based session (bcrypt password hashing) |
| **Forms** | React Hook Form + Zod validation |
| **Icons** | Lucide React |
| **Hosting** | Vercel |

---

## Architecture

```text
src/
├── app/
│   ├── page.tsx              # Landing page (client booking + stringer login)
│   ├── actions.ts            # Server Actions (CRUD, auth, job status)
│   ├── layout.tsx            # Root layout (RTL, Heebo font)
│   ├── booking/page.tsx      # Client booking form page
│   └── stringer/page.tsx     # Stringer dashboard (auth-protected)
├── components/
│   ├── BookingForm.tsx        # Client-facing booking form
│   ├── DashboardWrapper.tsx   # Stringer dashboard (3-column layout)
│   └── StringerLoginForm.tsx  # Stringer login form
└── lib/
    └── prisma.ts              # Prisma client (Turso adapter in prod, local SQLite in dev)

prisma/
├── schema.prisma              # Database schema (SQLite + driverAdapters)
├── seed.ts                    # Local database seeding script
└── turso-setup.mjs            # Remote Turso database setup & seeding utility
```

### Database Models

- **Manufacturer** — Racquet brands (Wilson, Babolat, Head, etc.)
- **RacquetModel** — Specific models linked to manufacturers
- **Stringer** — Internal users with hashed passwords and lockout protection
- **ServiceJob** — Core job tracking (status: Waiting → Scheduled → In Process → Completed)

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Create local SQLite database and seed data
npx prisma db push
npx prisma db seed

# Start dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000) using a local SQLite file (`dev.db`).

### Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL="file:./dev.db"
```

---

## Deployment (Vercel + Turso)

### Environment Variables (Vercel Dashboard)

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `file:./dev.db` (required at build time by Prisma) |
| `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Your Turso auth token |

### Initial Turso Database Setup

```bash
node prisma/turso-setup.mjs <TURSO_DATABASE_URL> <TURSO_AUTH_TOKEN>
```

This creates all tables and seeds manufacturers, models, and the initial stringer account directly on your Turso database.

### How It Works

- **Local dev:** Prisma connects to `dev.db` (local SQLite file)
- **Production (Vercel):** Prisma uses the `@prisma/adapter-libsql` driver to route queries to Turso over HTTPS

This dual-mode setup is handled in `src/lib/prisma.ts`.

---

## Key Features

- 🎾 **Client Booking** — Public form with manufacturer/model dropdowns, tension inputs, urgency selection
- 📋 **Stringer Dashboard** — 3-column layout: Waiting Queue → Shared Calendar → My Work
- 📱 **Responsive** — Optimized for mobile, tablet, and desktop
- 🔒 **Security** — Bcrypt password hashing, account lockout after 10 failed attempts
- 🌐 **RTL Support** — Full Hebrew interface with proper RTL/LTR handling for numeric fields
- 📞 **Quick Actions** — One-tap call and WhatsApp links on job cards

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Push schema to local SQLite |
| `npx prisma db seed` | Seed local database |
| `npx prisma studio` | Open Prisma visual editor |
