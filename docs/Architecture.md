# Architecture Overview

A concise technical reference for the Tennis Racquet Stringing webapp.

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Database | SQLite (local) / Turso LibSQL (production) |
| ORM | Prisma 5 with `driverAdapters` preview |
| Styling | Tailwind CSS 4 |
| Forms | React Hook Form + Zod validation |
| Auth | bcrypt password hashing + HTTP-only session cookies |
| Hosting | Vercel (app) + Turso (DB, EU-West-1) + GitHub (source) |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── client-history/
│   │       └── route.ts          # GET /api/client-history?phone=...
│   ├── booking/
│   │   └── page.tsx              # Client booking form page
│   ├── stringer/
│   │   └── page.tsx              # Stringer dashboard page
│   ├── actions.ts                # Server actions (CRUD, auth)
│   ├── layout.tsx                # Root layout (RTL, Heebo font)
│   ├── page.tsx                  # Landing page (role selector)
│   └── globals.css
├── components/
│   ├── BookingForm.tsx           # Client booking form (uses CustomSelect & CustomDatePicker)
│   ├── CustomDatePicker.tsx      # System-wide date picker (bypasses Chromium RTL bugs)
│   ├── CustomSelect.tsx          # System-wide dropdown (bypasses Chromium RTL bugs)
│   ├── DashboardWrapper.tsx      # Stringer dashboard (3-column)
│   ├── ExcelExportButton.tsx     # Phase 3: Client-side .xlsx export via exceljs
│   ├── MaterialUsageReport.tsx   # Phase 3: Reporting & date filtering
│   ├── RacquetHistoryChips.tsx   # Phase 2: phone lookup chips
│   ├── RestockAlerts.tsx         # Phase 3: Low-stock warnings
│   ├── StringAutocomplete.tsx    # Autocomplete for string selection
│   ├── StringerLoginForm.tsx     # Stringer login
│   └── StickyWelcomeBanner.tsx   # Welcome overlay
├── data/
│   └── strings.json              # 31 popular tennis strings
├── hooks/
│   └── usePersistedState.ts      # localStorage v3 (pre-fill + dismissals)
└── lib/
    └── prisma.ts                 # Prisma client singleton (Turso adapter)

prisma/
├── schema.prisma                 # Data model
├── seed.ts                       # Seed manufacturers, models, initial stringer
└── turso-setup.mjs               # Remote Turso migration/seed script
```

---

## Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Manufacturer │────<│ RacquetModel │────<│  ServiceJob  │>────│  Stringer  │
│──────────────│     │──────────────│     │──────────────│     │────────────│
│ id       PK  │     │ id       PK  │     │ id       PK  │     │ id     PK  │
│ name  UNIQUE │     │ name         │     │ trackingUUID  │     │ name UNIQUE│
└──────────────┘     │ manufacturerId│     │ clientName    │     │ passwordHash│
                     │ @@unique(name,│     │ clientPhone   │     │ isActive   │
                     │  manufacturerId)│   │ modelId    FK?│     │ failedLogin│
                     └──────────────┘     │ customRacquet │     │ lockedUntil│
                                          │ stringMain   ?│     └────────────┘
                                          │ stringCross  ?│
                                          │ mainsTension ?│
                                          │ crossTension ?│
                                          │ racquetCount  │
                                          │ urgency       │
                                          │ status        │
                                          │ stringerId FK?│
                                          │ dueDate       │
                                          │ scheduledDate?│
                                          │ completedAt  ?│
                                          │ createdAt     │
                                          └──────────────┘
```

**Status flow:** `Waiting` → `Scheduled` → `In Process` → `Completed`

---

## API Endpoints

| Method | Route | Purpose |
|:---|:---|:---|
| `GET` | `/api/client-history?phone=05XXXXXXXX` | Returns last 3 unique racquet setups for a phone number (equipment only, no PII) |

### Server Actions (`src/app/actions.ts`)

| Action | Purpose |
|:---|:---|
| `getManufacturers()` | Fetch all manufacturers (sorted, "Other" last) |
| `getModelsByManufacturerId(id)` | Fetch models for a manufacturer |
| `createServiceJob(data)` | Create a new booking |
| `getStringers()` | Fetch active stringers (id + name only) |
| `loginStringer(id, password)` | Authenticate + set session cookie |
| `logoutStringer()` | Clear session cookie |
| `addStringer(name, password)` | Register new stringer |
| `deactivateStringer(id)` | Soft-delete stringer (Tomer protected) |
| `getJobsForDashboard()` | Fetch all jobs with relations |
| `updateJobStatus(id, status, ...)` | Change job status/assignment |

---

## Client-Side Storage (localStorage)

**Key:** `racquet_booking_v3`

Persists between visits: client name, phone, manufacturer, model, string main/cross, tensions, and dismissed chip model IDs. Version bumps auto-discard stale data.

See `docs/Client-Recognition.md` for full spec (Phase 1 pre-fill + Phase 2 chip dismissals).

---

## Environment Variables

| Variable | Where | Purpose |
|:---|:---|:---|
| `DATABASE_URL` | `.env` | Local SQLite path (`file:./dev.db`) |
| `TURSO_DATABASE_URL` | Vercel | Turso remote DB URL |
| `TURSO_AUTH_TOKEN` | Vercel | Turso auth token |

---

## Seed Data

Managed via `prisma/seed.ts` (local) and `prisma/turso-setup.mjs` (remote):

- 9 manufacturers: Wilson, Babolat, Head, Yonex, Dunlop, Tecnifibre, Prince, Volkl, Other
- 30+ racquet models across all manufacturers
- 31 popular strings in `src/data/strings.json`
- Initial stringer account (Tomer)
