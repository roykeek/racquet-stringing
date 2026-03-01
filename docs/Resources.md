# Resources & Technology Stack

## Current Production Stack

### Core

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | Full-stack React framework (App Router) |
| TypeScript | 5.x | Type-safe JavaScript |
| React | 19.2.3 | UI library |

### Database & ORM

| Technology | Version | Purpose |
|---|---|---|
| Prisma | 5.22.0 | ORM with `driverAdapters` preview feature |
| Turso (LibSQL) | — | Cloud-hosted SQLite database |
| @libsql/client | 0.8.0 | LibSQL driver for Turso |
| @prisma/adapter-libsql | 5.22.0 | Prisma ↔ Turso bridge |

### Styling & UI

| Technology | Version | Purpose |
|---|---|---|
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Lucide React | 0.575.0 | Icon library |
| Heebo (Google Font) | — | Primary font for Hebrew typography |

### Forms & Validation

| Technology | Version | Purpose |
|---|---|---|
| React Hook Form | 7.71.2 | Performant form handling |
| Zod | 4.3.6 | Schema validation |
| @hookform/resolvers | 5.2.2 | Zod ↔ React Hook Form bridge |

### Security

| Technology | Version | Purpose |
|---|---|---|
| bcrypt | 6.0.0 | Password hashing |
| HTTP-only cookies | — | Session management |

### Hosting & Deployment

| Service | Purpose |
|---|---|
| Vercel | App hosting, CI/CD (auto-deploys from GitHub `main`) |
| Turso | Database hosting (EU-West-1 region) |
| GitHub | Source control |

## Typography & Icons

- **Primary Font:** [Heebo](https://fonts.google.com/specimen/Heebo) — Clean Hebrew typography
- **Icons:** [Lucide React](https://lucide.dev) — Wrench, LogOut, Phone, MessageCircle

## Seed Data

Managed via `prisma/seed.ts` (local) and `prisma/turso-setup.mjs` (remote Turso):

- 9 racquet manufacturers (Wilson, Babolat, Head, Yonex, Dunlop, Tecnifibre, Prince, Volkl, Other)
- 30+ racquet models across all manufacturers
- Initial stringer account (Tomer)
