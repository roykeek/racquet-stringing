# Walkthrough: How to Use the Webapp

This guide explains how both Clients and Stringers will interact with the Tennis Racquet Stringing platform.

---

## Part 1: For the Client (Booking a Stringing Job)

### 1. Accessing the Portal

* The client visits the website URL.
* On the main landing page, they click the button labeled **"הזמנת שזירה" (Book Stringing)**.

### 2. Filling Out the Form

* **Personal Info:** The client enters their Full Name and Phone Number.
* **Racquet Selection:**
  * They select their racquet's Manufacturer from a dropdown (e.g., Babolat).
  * A second dropdown automatically populates with models for that brand. They select their Model (e.g., Pure Aero).
  * *Note:* If their brand/model isn't listed, they select "Other" and manually type it in.
* **String Preferences:**
  * They type in their preferred string (e.g., RPM Blast).
  * They specify the tension in **Lbs** for both the Mains and the Crosses.
* **Details:**
  * They specify the quantity of racquets needing this exact setup.
  * They select the Urgency level (Standard, Express, Immediate).
* **Submission:** They click **"שלח בקשה" (Submit)**.

### 3. Tracking the Order

* Upon successful submission, a confirmation message appears.
* The client receives a unique tracking link. They can visit this link at any time to see if their racquet is 'Waiting', 'In Process', or 'Completed'.

---

## Part 2: For the Stringer (Managing Workflow)

### 1. Logging In

* The stringer visits the website URL. The login form is directly available on the main landing page.
* They select their Name from a dropdown list and enter their Password.

### 2. Dashboard Overview

Once logged in, the stringer sees three main areas:

* **Waiting Queue (Requests):** A list of all newly submitted client jobs. Red cards indicate "Immediate" urgency.
* **Shared Calendar:** A view of the next two weeks showing jobs assigned to all stringers, color-coded by status.
* **Work Management:** A list of jobs actively in progress and a history of completed jobs.

### 3. Scheduling and Claiming a Job

* In the Wait Queue, the stringer clicks on a new job card.
* A calendar modal pops up. The stringer selects the date they plan to work on the racquet.
* The system assigns the job to this stringer, changes the status to 'Scheduled', and moves it to the appropriate day on the Shared Calendar.

### 4. Processing a Job

* On the scheduled day, the stringer clicks the job on their Calendar or in their "My Jobs" list.
* They use the dropdown menu to change the status to **"In Process"**.
* Once the racquet is strung, they update the status to **"Completed"**.
* This updates the client's Read-Only tracker link so the client knows their racquet is ready.

### 5. Contacting the Client

* While viewing a job, the stringer can click the "Phone" or "WhatsApp" icons to quickly communicate with the client regarding their order or pickup.

### 6. Adding a New Stringer

* Any logged-in stringer can navigate to the Work Management section and click **"+ הוסף שוזר/ת חדש/ה למערכת" (Add Stringer)**.
* They enter a Name and a Password to create a new profile. This new stringer can immediately log in from the main portal.

### 7. Deactivating a Stringer

* At the bottom of the Work Management section, a stringer can click **"הפוך שוזר/ת קיימ/ת ללא זמין/ה" (Deactivate Stringer)**.
* They select an active stringer from the list and submit. A warning prompt will ensure they want to proceed.
* Deactivated stringers are hidden from the login list and assignment lists, but their historical job data remains intact. The main profile 'Tomer' cannot be deactivated for safety.
