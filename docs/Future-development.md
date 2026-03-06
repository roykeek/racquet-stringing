# Future Development Backlog

This document serves as a living repository for ideas, features, and improvements that have been discussed but postponed for later stages of development.

## 🧪 Testing & Quality Assurance

- [ ] Set up an end-to-end automated testing framework (e.g., Playwright or Cypress).
- [ ] Add unit and component tests (e.g., Jest + React Testing Library) to ensure reliability.
  - [x] Defined unit testing strategy in `docs/Unit-Testing-Plan.md`.
  - [x] Defined Server Action / Database test strategy in `docs/API-DB-Mocking-Plan.md`.

## 🚀 Phase 2 — Client Recognition & String Standardisation

- [x] **Phone Lookup (Smart History):** After the client types their phone number, query the DB for their last 3 unique racquet setups and show as clickable chips. See `docs/Client-Recognition.md` for full spec.
- [x] **Split `stringTypes` → `stringMain` + `stringCross`:** Schema change to support hybrid setups and enable accurate material tracking. Existing test data can be deleted (no migration needed).
- [x] **Smart Autocomplete for strings:** Static JSON list of ~30 popular strings with fuzzy search on the booking form. Custom entry allowed for unlisted strings.
- [x] **Rate limiting:** Required before shipping Phase 2 phone lookup to production. Prevent enumeration attacks on `/api/client-history`. Recommended: Upstash Redis + `@upstash/ratelimit`.

## 📊 Phase 3 — Stringer Dashboard: Material Usage & Reporting

- [x] **Material Usage Report:** Query `stringMain`/`stringCross` across completed jobs to show how many times each string was used in a given period. Filterable by date range and string name.
- [x] **Restock Alerts:** Surface insights like "You used RPM Blast in 15 jobs last month — time to restock?"
- [x] **Excel Export:** Export job data and material usage reports to `.xlsx` using `exceljs` and `file-saver`. Client-side generation, no server dependency.

## 🛠️ Technical Debt & Refactoring

*(No items yet)*

## 🎨 UI / UX Improvements

*(No items yet)*
