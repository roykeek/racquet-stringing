# Tennis Racquet Stringing Webapp - Final Design Specification

**Target Region:** Israel
**Core Functionality:** Dual-role portal for Clients (booking) and Stringers (management).

---

## 1. Global Technical Standards

* **Languages & Direction:** Support for both Hebrew (`lang="he"`, `dir="rtl"`) and English (`lang="en"`, `dir="ltr"`).
  * *Crucial RTL Rule:* Numeric inputs (Phone numbers, Tensions) and LTR text (Emails) must explicitly retain `dir="ltr"` even in Hebrew mode to prevent browser-flipping formatting issues.
* **Typography:** Primary font family: **'Heebo', sans-serif**.
* **Responsiveness:** Fully functional on Desktop, Tablet, and Mobile (Android/iOS).
* **Measurement Standard:**
  * Tension: **Lbs (Pounds)**.
  * Dates: DD/MM/YYYY.
* **Platform Strategy:** Progressive Web App (PWA) recommended for mobile "add to home screen" capability and offline caching.

---

## 2. Database Schema (Backend Architecture)

### A. Manufacturers (`manufacturers`)

*Lookup table for racquet brands.*

* `ManufacturerID` (INT, PK)
* `Name` (VARCHAR) - e.g., Wilson, Babolat, Head, and a static "Other" option.

### B. Racquet Models (`racquet_models`)

*Linked to manufacturers.*

* `ModelID` (INT, PK)
* `ManufacturerID` (INT, FK) - Links to `manufacturers`.
* `ModelName` (VARCHAR) - e.g., Pure Drive, Pro Staff 97, and a static "Other" option.

### C. Stringers (`stringers`)

*Internal users.*

* `StringerID` (INT, PK)
* `Name` (VARCHAR) - Unique.
* `PasswordHash` (VARCHAR) - Encrypted password.
* `IsActive` (BOOLEAN) - Default: True.
* *Initial Seed Data:* Name: **Tomer**, Password: **1t2k**.

### D. Service Jobs (`service_jobs`)

*The central transaction table. Note: Payment/Pricing is excluded from the app.*

* `JobID` (INT, PK)
* `TrackingUUID` (VARCHAR) - Unique ID for client read-only status page.
* `ClientName` (VARCHAR)
* `ClientPhone` (VARCHAR)
* `ModelID` (INT, FK, Nullable) - Links to `racquet_models`. Null if "Other" is chosen.
* `CustomRacquetInfo` (VARCHAR, Nullable) - Used if Manufacturer/Model is "Other".
* `StringTypes` (TEXT) - e.g., "Mains: Poly / Cross: Syn Gut".
* `MainsTension_lbs` (DECIMAL) - **Must be LBS**.
* `CrossTension_lbs` (DECIMAL) - **Must be LBS**.
* `RacquetCount` (INT) - Default: 1. (Assumes same string/tension setup for all racquets in this job).
* `Urgency` (ENUM) - 'Standard', 'Express', 'Immediate'.
* `Status` (ENUM) - 'Waiting', 'Scheduled', 'In Process', 'Completed'. Default: 'Waiting'.
* `StringerID` (INT, FK, Nullable) - Assigned stringer.
* `DueDate` (DATE) - When the client expects to pick it up.
* `ScheduledDate` (DATE, Nullable) - Date the stringer plans to work on it.
* `CreatedAt` (TIMESTAMP).

---

## 3. User Interface (UI) & Flows

### A. Landing Page (Public)

**Layout:** Centralized split-screen or two large cards.

1. **Client Button:** "הזמנת שזירה" (Book Stringing) -> Redirects to Booking Form.
2. **Stringer Login:** "כניסת מנהלים ושוזרים" (Stringer Login Form) -> Displays the login dropdown and password field directly on the page, redirecting to the Stringer Dashboard upon success.

### B. Client Flow (Booking Form)

**Access:** No login required.
**Fields (Adapts to RTL/LTR layout):**

1. **Full Name:** Text Input.
2. **Phone Number:** Tel Input (Mobile: Numeric keypad. Must be `dir="ltr"`).
3. **Manufacturer:** Dropdown (Selects from DB). Includes "Other".
4. **Racquet Model:** Dynamic Dropdown (Loads models based on Manufacturer selection). Includes "Other".
    * *Dynamic Logic:* If "Other" is selected in either, show a free-text input for brand/model.
5. **String Type:** Text Input (Free text for string preferences).
6. **Tension (Lbs):**
    * Two Number Inputs (`dir="ltr"`): **Mains** & **Crosses**.
    * *Label must explicitly say "Lbs".*
7. **Quantity:** Number Input (Default: 1). (Message: "Submit separate requests for different stringing setups").
8. **Urgency:** Radio Buttons (Standard / Express / Immediate).
9. **Action:** "שלח בקשה" (Submit) button.

**Logic:**

* On Submit -> Validate inputs -> Create record in `service_jobs` with Status 'Waiting' and generate a `TrackingUUID`.
* Show "Success" message containing a link to a read-only Status Page (using the UUID).

---

### C. Stringer Flow (Internal)

#### 1. Login Logic

*Flow moved directly to the Public Landing Page.*

* **Selector:** Dropdown list of existing active Stringer Names (from DB).
* **Password:** Password input field.
* **Action:** Verify against `PasswordHash` and redirect to Stringer Dashboard.

#### 2. Stringer Dashboard (Desktop View)

**Header:**

* Right: App Logo.
* Left: [User Name] | [Role Icon 🛠️] | [Logout Icon].

**Layout (3-Column Grid):**

* **Column 1 (Right): Waiting Queue (Requests)**
  * List of cards: Client Name, Urgency (Red for Immediate), Racquet Model.
  * *Action:* Click card -> Open "Schedule Modal".
* **Column 2 (Center): Bi-Weekly Calendar (Shared View)**
  * Grid view of next 14 days.
  * Shows jobs assigned to *all* stringers.
  * *Color Coding:*
    * Yellow: Scheduled (Assigned but not started).
    * Blue: In Process.
    * Green: Completed.
* **Column 3 (Left): Work Management**
  * **In Process:** Jobs currently being worked on by *this* logged-in stringer.
  * **Completed:** History of finished jobs.
  * **Stringer Tools:** Any logged-in stringer can add or deactivate a stringer. "Add Stringer" button (Open form: Name + Password). "Deactivate Stringer" button (Open form: Select stringer + Submit).

#### 3. Stringer Dashboard (Mobile View)

*Responsive Adaptation for Small Screens.*

**Navigation:**

* **Top Bar:** User info & Logout.
* **Bottom Navigation Bar (Tabs):**
    1. **Requests (בקשות):** The "Waiting" queue.
    2. **Calendar (יומן):** The schedule view.
    3. **My Jobs (העבודות שלי):** In Process & Completed.

**Tab Behavior:**

* **Requests Tab:** Vertical list of cards. Tap to schedule.
* **Calendar Tab:** **Agenda View** (Vertical list of days) instead of a grid. Tap a day to expand and see jobs.
* **My Jobs Tab:** List of active jobs. Tap to update status.

---

## 4. Key Logic & Interactions

### Scheduling a Job

1. Stringer clicks a "Waiting" job card.
2. **Modal Opens:** "Select Service Date".
3. Stringer picks a date.
4. **System Action:**
    * Update `service_jobs`: Set `Status` = 'Scheduled', `StringerID` = Current User, `ScheduledDate` = Selected Date.
    * Refresh Calendar view.

### Status Updates

1. Stringer clicks a job in the Calendar or "My Jobs" list.
2. **Action Sheet Opens:**
    * Dropdown: Change Status (Scheduled -> In Process -> Completed).
    * **Client Actions:**
        * [📞 Call Client] (`tel:` link).
        * [💬 WhatsApp] (`wa.me` link).

### Admin: Adding a Stringer

1. Click "+ הוסף שוזר/ת חדש/ה למערכת" (available to any logged-in stringer).
2. Input: New Name, New Password.
3. **System Action:** Create new record in `stringers` table.
4. New stringer immediately appears in Login Dropdown.

### Admin: Deactivating a Stringer

1. Click "הפוך שוזר/ת קיימ/ת ללא זמין/ה" (available to any logged-in stringer).
2. Input: Select Stringer from dropdown (Excludes "Tomer").
3. Confirm Warning Prompt.
4. **System Action:** Update `IsActive` = false in `stringers` table for selected stringer. Note: "Tomer" cannot be deactivated on the backend.
5. Deactivated stringer is removed from login lists and assignment selectors.
