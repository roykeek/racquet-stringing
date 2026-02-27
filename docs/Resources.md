# Resources Needed for Development

To successfully build the Tennis Racquet Stringing Webapp, the following resources, technologies, and assets are needed:

## 1. Technology Stack

* **Frontend Framework:** React or Next.js (recommended for routing and server-side features) or simple HTML/CSS/JS if creating a lightweight PWA.
* **Styling:** Vanilla CSS or Tailwind CSS for rapid prototyping and responsive layout.
* **Backend Framework:** Node.js (Express), Python (FastAPI/Flask), or a Serverless setup (like Vercel functions).
* **Database:** PostgreSQL or MySQL for structured relational data (`service_jobs`, `stringers`, `racquet_models`).
* **ORM / Database Client:** Prisma, Drizzle, or raw SQL queries to interact with the database.

## 2. Typography & Icons

* **Primary Font:** [Heebo](https://fonts.google.com/specimen/Heebo) (Google Fonts). Essential for clean Hebrew typography.
* **Icons:**
  * Phosphor Icons, Lucide, or FontAwesome for role icons (🛠️), logout icons, WhatsApp icons, and general UI signs.

## 3. Libraries & Packages

* **Date Management:** `date-fns` or `dayjs` for handling scheduling and bi-weekly calendars.
* **Form Handling & Validation:** `react-hook-form` and `zod` (if using React) to ensure inputs like Phone Numbers and Tensions are valid.
* **UUID Generation:** `uuid` or crypto library for generating secure client order tracking links `TrackingUUID`.
* **Password Hashing:** `bcrypt` or `argon2` for storing stringer passwords securely.

## 4. Seed Data Requirements

To initialize the application, you will need:

* A JSON or CSV list of common Racquet Manufacturers (Wilson, Babolat, Head, Yonex, Prince, etc.).
* A JSON or CSV list of popular Racquet Models for those manufacturers.
* The initial stringer account credentials (Name: Tomer, Password: to be hashed).

## 5. Hosting & Deployment

* **Frontend Hosting:** Vercel, Netlify, or similar fast CDN-based hosting.
* **Database Hosting:** Supabase, Neon Database, or PlanetScale for accessible Postgres/MySQL instances.
* **Domain:** A custom domain configured with SSL/HTTPS (required for PWAs).
