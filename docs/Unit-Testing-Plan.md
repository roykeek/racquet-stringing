# Unit Testing Plan

This document outlines the strategy, scope, and specific implementation details for unit and component testing within the Racquet Stringing application.

## 1. Objective

To ensure reliability and prevent regressions by introducing automated testing for the most critical, isolated pieces of the application: data schemas, custom hooks, and utility functions.

## 2. Technology Stack

* **Test Runner:** Jest (via `next/jest`)
* **Component & Hook Testing:** `@testing-library/react` (React Testing Library)
* **Environment:** `jest-environment-jsdom`
* **Mocking:** `jest-mock-extended` (for Prisma DB mocks)

## 3. Scope of Unit Tests

Unit testing focuses on pure logic execution without browser rendering or database interaction. These tests will be grouped into the following categories:

### A. Zod Validation Schemas (`src/lib` / Component internal schemas)

Zod schemas ensure data integrity before it reaches the database. We will test these to verify they reject invalid inputs and accept valid ones, checking for edge cases like missing fields, improper types, or strings that don't meet formatting requirements.

### B. Custom React Hooks (`src/hooks`)

Testing stateful logic that is isolated from the UI using `@testing-library/react/renderHook`. This ensures our custom hooks behave correctly over consecutive renders and state updates.

**Example target:** `usePersistedState.ts`

* Verify initial state loading.
* Verify `localStorage` writes upon state changes.
* Verify fallback behavior when `localStorage` is empty.

### C. Pure Utility Functions (`src/lib`, `src/data`)

Testing functions that handle formatting, data transformation, or calculations.

## 4. Folder Structure & Colocation

Test files will follow a colocation strategy, typically appending `.test.ts` or `.test.tsx` to the target file's name in the same directory, or placing them in a `__tests__` folder if required.

```text
src/
  hooks/
    usePersistedState.ts
    usePersistedState.test.ts  <-- Unit test file
```

## 5. Mocking Strategy

The application relies heavily on Prisma for database access. To keep unit tests fast and deterministic:

1. **Never** connect to the real SQLite/LibSQL database during unit tests.
2. Use `jest-mock-extended` to create a globally accessible mock of the Prisma client.
3. Inject this mock during tests to simulate specific database returns.

## 6. Implementation Steps

1. [x] Create `feature/unit-tests` branch.
2. [x] Install the required dependencies (`jest`, `@testing-library/react`, etc.).
3. [x] Configure `jest.config.ts` and `jest.setup.ts`.
4. [x] Extract validation schemas from components into a separate file for easier testing.
5. [x] Write initial test suites (e.g., `usePersistedState.test.ts`).

## 7. Current Coverage Status (Phase 1)

As of the initial unit testing phase, core utilities and validation schemas are fully tested.

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **All files** | **95.97%** | **68%** | **100%** | **95.97%** |  |
| `hooks/usePersistedState.ts`| 95.12% | 68% | 100% | 95.12% | 70-72, 97, 113-114 (Silent try/catch fails) |
| `lib/validations.ts`| 100% | 100% | 100% | 100% | None |

### Test Locations

Test suites are colocated alongside their respective source files:

* Zod Validation Schemas: `src/lib/validations.test.ts`
* Persisted State Hook: `src/hooks/usePersistedState.test.ts`

## 8. Execution Instructions

### Manual Triggers

You can run the test suites locally at any time using the `package.json` scripts:

* **Run all tests once:**

    ```bash
    npm run test
    ```

* **Run tests in Interactive Watch Mode (recommended during development):**

    ```bash
    npm run test:watch
    ```

    *(Jest will silently watch for saved file changes and only re-run tests related to the modified files).*
* **Generate a Coverage Report:**

    ```bash
    npm run test -- --coverage
    ```

### Automated Triggers (CI/CD)

Currently, automated testing is **not** actively blocking deployments, but the infrastructure is ready.

In the future, automated tests should be configured to run automatically during:

1. **Pre-commit Hooks (Husky/lint-staged):** Prevents developers from committing code that breaks existing unit tests locally.
2. **Pull Request (CI Workflow):** Setting up a GitHub Action (`.github/workflows/test.yml`) that runs `npm run test` automatically every time a Pull Request is opened against the `main` branch. Vercel deployment would be blocked if this check fails.
