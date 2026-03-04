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

## Phase 2 — Smart History: Multi-Racquet Phone Lookup (Planned)

**Branch:** `feature/client-phone-lookup` *(not started)*

**Concept:** When the client enters their phone number, the system queries `ServiceJob` for their **last 3 unique racquet models** (grouped by `modelId`, showing the most recent tension/string for each). These appear as clickable "Quick Select" chips between the contact info and racquet sections of the form.

### User Experience

After entering a phone number, the client sees:

```text
"מצאנו את המחבטים שלך:"
[ 🎾 Babolat Pure Drive  ·  RPM Blast  ·  52/50 lbs ]  ✕
[ 🎾 Babolat Pure Aero   ·  Syn Gut    ·  50/48 lbs ]  ✕
```

- Clicking a chip → pre-fills manufacturer, model, string type, and both tensions
- User can **edit any pre-filled value** — the chip is a starting point, not a lock
- Clicking ✕ dismisses that racquet (stored in localStorage blocklist)

### Planned API Route

```http
GET /api/c/[slug]/client-history?phone=05XXXXXXXX
```

**Returns an array (equipment fields only — no PII):**

```json
[
  {
    "modelId": 12,
    "modelName": "Pure Drive",
    "manufacturerName": "Babolat",
    "manufacturerId": 3,
    "stringTypes": "RPM Blast",
    "mainsTensionLbs": 52,
    "crossTensionLbs": 50,
    "lastUsed": "2026-01-15T10:30:00Z"
  }
]
```

### DB Query

Groups by `modelId` to prevent clutter (Pure Drive 52lbs, Pure Drive 53lbs, etc.). Shows the **latest** tension/string for each unique model within the last 18 months.

```sql
SELECT
  sj.modelId,
  rm.name AS modelName,
  m.name AS manufacturerName,
  m.id AS manufacturerId,
  sj.stringTypes,
  sj.mainsTensionLbs,
  sj.crossTensionLbs,
  MAX(sj.createdAt) AS lastUsed
FROM ServiceJob sj
JOIN RacquetModel rm ON sj.modelId = rm.id
JOIN Manufacturer m ON rm.manufacturerId = m.id
WHERE sj.clientPhone = ?
  AND sj.status != 'CANCELLED'
  AND sj.modelId IS NOT NULL
  AND sj.createdAt > datetime('now', '-18 months')
GROUP BY sj.modelId
ORDER BY lastUsed DESC
LIMIT 3;
```

> 💡 **Why 18 months?** 1 year is too tight for casual players who string 1-2 times/year. 18 months covers recreational players while still expiring sold racquets naturally.

### Dismissing Racquets (✕ Button)

Dismissed racquets are stored as a **localStorage blocklist** — no schema change needed.

```ts
// In usePersistedState.ts — bump version to 2
interface PersistedBookingData {
  version: 2;
  // ... existing fields
  dismissedModelIds: string[];  // e.g. ["12", "5"]
}
```

| Approach considered | Storage | Chosen? | Why |
| :--- | :--- | :--- | :--- |
| **A. LocalStorage blocklist** | Browser | ✅ Yes | Zero backend work, consistent with Phase 1 |
| B. DB table (`DismissedRacquets`) | Database | No | Schema change not worth it for a soft preference |
| C. Session-only (React state) | Memory | No | Dismiss resets on every visit — annoying |

> ⚠️ **Trade-off:** If the user clears browser cache, dismissed racquets reappear. This is acceptable because (a) it's a 1-second ✕ tap to dismiss again, and (b) the 18-month expiry handles sold racquets naturally.

### Chip Placement in the Form

Chips appear **between the contact info section and the racquet section** — contextually near the fields they will pre-fill, not at the top of the entire form.

```text
┌─────────────────────────────┐
│  שם מלא          טלפון      │  ← Contact info
├─────────────────────────────┤
│  "מצאנו את המחבטים שלך:"    │  ← Chips appear here
│  [ Pure Drive · 52/50 ]  ✕  │
│  [ Pure Aero  · 50/48 ]  ✕  │
├─────────────────────────────┤
│  יצרן מחבט      דגם מחבט    │  ← Racquet section (pre-filled when chip is clicked)
│  סוג גיד       מתיחה        │
└─────────────────────────────┘
```

### UX Flow

1. Client types phone number → **debounce 600ms** → API call (only when 10 digits)
2. If history found → chips slide in with a subtle animation
3. Client clicks a chip → manufacturer, model, string type, and tensions all pre-fill
4. Client can still edit any value freely
5. If no history → nothing shown, form works normally

### Security Requirements (must implement before shipping)

- **Rate limiting** on the route to prevent enumeration attacks (e.g. Upstash Redis + `@upstash/ratelimit`, or Vercel's built-in rate limiting on Pro).
- **Only return technical/equipment fields** — never name, address, or other PII.
- **Debounce** the client-side trigger to 600ms, and only fire when the phone number is 10 digits.

### Why Phase 2 Matters

- Phase 1 returns what the client *thought* they ordered. Phase 2 returns what the stringer *actually strung* — which may differ (tension adjustments, string substitutions).
- Multi-racquet support handles the common scenario of players with 2-3 racquets, each with different setups.
- The "we remember your racquets" experience creates a premium, professional feel that drives repeat bookings.
