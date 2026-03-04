# Future Development Backlog

This document serves as a living repository for ideas, features, and improvements that have been discussed but postponed for later stages of development.

## 🧪 Testing & Quality Assurance

- [ ] Set up an end-to-end automated testing framework (e.g., Playwright or Cypress).
- [ ] Add unit and component tests (e.g., Jest + React Testing Library) to ensure reliability.

## 🚀 New Features & Enhancements

- [/] **Client Recognition — Phase 2 (Phone Lookup):** After the client types their phone number, query the DB for their last completed order and pre-fill equipment fields (Racquet, String, Tension). See `docs/Client-Recognition.md` for full spec and security requirements.

## 🛠️ Technical Debt & Refactoring

- [ ] **Rate limiting:** Required before shipping Phase 2 phone lookup. Prevent enumeration attacks on `/api/c/[slug]/client-history`. Recommended: Upstash Redis + `@upstash/ratelimit`.

## 🎨 UI / UX Improvements

*(No items yet)*
