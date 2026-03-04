# Client Recognition Feature

A two-phase feature that recognises returning clients and pre-fills the booking form with their previous details, reducing friction and creating a premium "we remember you" experience.

---

## Phase 1 — LocalStorage Pre-fill ✅ (04/03/2026)

**Branch:** `feature/client-localstorage` → merged to `main`

**Concept:** On successful form submission, the client's details are saved to the browser's `localStorage`. On their next visit the form is silently pre-filled with those details.

### Files Changed

| File | Change |
| :--- | :--- |
| `src/hooks/usePersistedState.ts` | **New.** Versioned read/write/clear helpers for localStorage |
| `src/components/BookingForm.tsx` | Wired pre-fill on mount, save on submit, welcome banner |

### What Gets Persisted

| Field | Persisted? | Reason |
| :--- | :---: | :--- |
| Client Name | ✅ | Convenience |
| Client Phone | ✅ | Required for future Phase 2 DB lookup |
| Manufacturer | ✅ | Rarely changes |
| Model | ✅ | Rarely changes |
| String Type | ✅ | Rarely changes |
| Mains Tension (Lbs) | ✅ | Core value-add |
| Crosses Tension (Lbs) | ✅ | Core value-add |
| Urgency | ❌ | Context-dependent each visit |
| Due Date | ❌ | Always stale |
| Racquet Count | ❌ | Varies per visit |

### UX Behaviour

- A dismissible blue banner — *"👋 ברוכ/ה השב/ה! מילאנו מראש את הפרטים מהביקור הקודם שלך."* — appears at the top of the form when pre-filled data is detected.
- Data is saved **only on successful submit** — never on partial fills.
- If localStorage is unavailable (strict private browsing) the feature fails silently; the form works normally.

### Schema Versioning

The stored object includes a `version: 1` key. If the form field shape ever changes in the future, bump this version number in the hook — old cached data will be automatically discarded rather than causing bugs.

```ts
// src/hooks/usePersistedState.ts
const STORAGE_KEY = "racquet_booking_v1";
```

### Limitations

- **Device-bound:** Data is stored in the specific browser on the specific device. A client who books on their phone will not be recognised on their laptop.
- **Fragile:** Clearing browser cache or using Incognito removes the data.

---

## Phase 2 — Phone Number Lookup (Planned)

**Branch:** `feature/client-phone-lookup` *(not started)*

**Concept:** After the client enters their phone number, a debounced API call checks the `ServiceJob` table for their last completed order and upgrades the pre-fill with the actual strung specs (overriding Phase 1 data with more accurate DB data).

### Planned API Route

```http
GET /api/c/[slug]/client-history?phone=05XXXXXXXX
```

**Returns (equipment fields only — no PII):**

```json
{
  "manufacturerId": 3,
  "modelId": 12,
  "stringTypes": "Babolat RPM Blast",
  "mainsTensionLbs": 54,
  "crossTensionLbs": 52
}
```

### DB Query

```sql
SELECT manufacturerId, modelId, stringTypes, mainsTensionLbs, crossTensionLbs
FROM ServiceJob
WHERE clientPhone = ?
  AND status NOT IN ('CANCELLED')
ORDER BY createdAt DESC
LIMIT 1;
```

### Security Requirements (must implement before shipping)

- **Rate limiting** on the route to prevent enumeration attacks (e.g. Upstash Redis + `@upstash/ratelimit`, or Vercel's built-in rate limiting on Pro).
- **Only return technical/equipment fields** — never name, address, or other PII.
- **Debounce** the client-side trigger to 600ms, and only fire when the phone number is 10 digits.

### Why Phase 2 Matters

Phase 1 returns what the client *thought* they ordered. Phase 2 returns what the stringer *actually strung* — which may differ, making it more accurate for repeat orders.
