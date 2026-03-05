# API & Database Mocking Plan

This document outlines the strategy for writing unit tests for our Next.js Server Actions (our internal API layer).

## 1. Objective

To independently test our Server Actions (`src/app/actions.ts`) to verify that they correctly handle business logic, parameters, and Prisma ORM calls *without* requiring an active connection to the SQLite/Turso database.

This guarantees fast, reliable, network-independent test runs.

## 2. Technology Stack

* **Test Runner:** Jest (via `next/jest`)
* **Mocking Library:** `jest-mock-extended` (creates deeply nested TypeScript-safe mocks of the Prisma Client)
* **Assertions:** Jest Matchers (`toHaveBeenCalledWith`, `resolves.toEqual`)

## 3. Scope of Mocks

We will write unit tests for the functions exported in `src/app/actions.ts`.

### A. Read Operations (e.g., `getModelsByManufacturerId`)

We will verify that passing an ID properly filters the database call.

* **Mock Objective:** Set `prismaMock.racquetModel.findMany.mockResolvedValue([])`
* **Assertion:** Did the function parse the arguments and successfully request the correct `where: { manufacturerId }` filter?

### B. Write Operations (e.g., `createServiceJob`)

We will verify the data transform layer (converting Next.js form objects into Prisma schema payloads).

* **Mock Objective:** Intercept `prismaMock.serviceJob.create` to return a fake ID.
* **Assertion:** Does the action return a `{ success: true, trackingId }` shape if the creation succeeds? Does it return a `{ success: false, error: ... }` shape if Prisma throws an error (which we can simulate)?

### C. Authentication (e.g., `loginStringer`)

We will test that incorrect passwords or non-existent user lookups return proper error payloads.

* **Mock Objective:** Use `bcrypt` to compare mocked hashes.

## 4. Implementation Details

1. **Global Mock Setup:** We will create `src/__mocks__/prisma.ts` which exports the `DeepMockProxy<PrismaClient>`.
2. **Jest Override:** We will instruct Jest to swap out the real `src/lib/prisma` with our fake `__mocks__/prisma.ts` across all `.test.ts` files automatically.
3. **Test Colocation:** We will create `src/app/actions.test.ts`.

## 5. Potential Risks & Limitations

* **False Confidence of Integrity:** Mocking tests the *logic* around the database, but it assumes the database schema is correct. It will not catch if you accidentally add a column name that doesn't actually exist in SQLite. E2E tests are still required for full system validation.
* **Maintenance Overhead:** If the Prisma schema frequently changes, the TypeScript mock return values in the test files must be manually kept in sync.

## 6. Current Coverage Status

The unit tests for the API layer are located in `src/app/actions.test.ts`.

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |
| --- | --- | --- | --- | --- | --- |
| `src/app/actions.ts` | 68.65 | 50 | 88.88 | 70 | 56-57, 83-84, 91-99, 146-147, ... |

*Note: The uncovered lines represent specific error-catching UI pathways (e.g., throwing a generic network failure during deactivation or duplicate stringer creation) which are lower priority than the primary success/validation pathways tested.*
