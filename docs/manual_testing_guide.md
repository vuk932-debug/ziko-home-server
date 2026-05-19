# ZikoHome Platform - Comprehensive Manual Testing & Demo Guide

This document provides a complete guide for setting up, running, and manually testing the ZikoHome real estate platform. It covers all core modules, role-based access controls, and edge cases necessary for QA validation or a client demo.

---

## 1. System Setup & Configuration

### 1.1 Prerequisites
*   **Node.js**: v18 or higher
*   **Database**: MySQL (running locally or via Docker)
*   **Terminal**: Ability to run multiple terminal sessions

### 1.2 Environment Configuration
Create `.env` files in both the `server` and `client` directories.

**Backend (`server/.env`)**:
```env
PORT=5000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/zikohome"
JWT_SECRET="your_super_secret_jwt_key"
NODE_ENV="development"
# Note: OTPs and temporary passwords will be logged to the console in development.
```

**Frontend (`client/.env` or `client/.env.development`)**:
```env
VITE_API_URL="http://localhost:5000/api/v1"
```

### 1.3 Installation & Database Setup
Open a terminal in the project root and execute the following:

```bash
# 1. Install Backend Dependencies
cd server
npm install

# 2. Database Migration & Seeding
npx prisma migrate dev --name init
npx prisma db seed # Seeds subscription plans and the initial Admin user

# 3. Install Frontend Dependencies
cd ../client
npm install
```

### 1.4 Running the Application
Start the backend and frontend in separate terminal windows.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
# Watch the console! OTPs and generated passwords will appear here.
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
# Access the app at http://localhost:5173
```

---

## 2. Test Accounts & Role Definitions

The system utilizes three distinct roles. 
*   **Admin**: Total system control. Created via DB seeding.
    *   *Default Email*: `admin@zikohome.com`
    *   *Default Password*: `admin123` (Check `seed.ts` to confirm exact seeded credentials)
*   **Channel Partner (CP)**: Uploads listings, manages leads. **Cannot self-register.** Must be created by Admin.
*   **Customer**: Browses listings, captures leads. Can self-register.

---

## 3. End-to-End Test Scenarios

### Module 1: Admin Onboarding & CP Login (Phase 1)

**Scenario 1.1: Admin Creates a CP**
1.  **Action**: Login to the frontend as Admin (`/login`).
2.  **Action**: Navigate to **User Management** -> **Clients** in the sidebar.
3.  **Action**: Click **Onboard CP**. Fill in Name, Email (`cp1@test.com`), and Phone (`1234567890`). Submit.
4.  **Expected Result**: Success modal displays the generated `Agent ID` (e.g., ZH-CP-0001) and a `Temporary Password`.
5.  **Backend Verification**: Check the backend console. You should see `[ADMIN] NEW CP CREATED (TRANSACTIONAL)` with the plain-text password.

**Scenario 1.2: CP First Login**
1.  **Action**: Open an incognito window or log out of Admin. Go to `/login`.
2.  **Action**: Enter the CP's Email (`cp1@test.com`) and the `Temporary Password` generated in Scenario 1.1.
3.  **Expected Result**: Successful login. Redirected to the CP Dashboard (`/cp`).
4.  **Security Check (Negative)**: Attempt to register a CP account via the public `/register` page. It should default to `Customer` role or fail if CP is explicitly selected.

---

### Module 2: Subscription Management (Phase 2)

**Scenario 2.1: Admin Assigns Plan to CP**
1.  **Action**: Login as Admin. Navigate to **Subscriptions**.
2.  **Action**: Select the newly created CP from the dropdown. Select **Standard (10 Listings)**.
3.  **Action**: Set Start Date to today, End Date to 1 month from today. Click Assign.
4.  **Expected Result**: Success message.

**Scenario 2.2: CP Verifies Subscription**
1.  **Action**: Login as CP. View the **Dashboard** (`/cp`).
2.  **Expected Result**: The "Plan" card shows `STANDARD`, `ACTIVE`, and the correct days remaining. The "Inventory" card shows `0 Listings` out of `10 max`.

**Scenario 2.3: Invalid Dates (Negative Check)**
1.  **Action**: As Admin, attempt to assign a plan where End Date is *before* Start Date.
2.  **Expected Result**: Form validation prevents submission, or Backend API returns `400 Bad Request: Start date must be before end date`.

---

### Module 3: Property Management & Listing Limits (Phase 6 & 8)

**Scenario 3.1: CP Adds Property (Within Limits)**
1.  **Action**: Login as CP. Go to **My Properties** (`/cp/properties`). Click **New Entry**.
2.  **Action**: Fill out all details (Title, Price, Area, etc.). Submit.
3.  **Expected Result**: Property is created. The list updates. Dashboard usage shows `1 / 10`.

**Scenario 3.2: Enforcing Listing Limits (Negative Check)**
1.  **Context**: Assume CP is on STANDARD (10 limit).
2.  **Action**: Use an API client (like Postman or a script) with the CP's JWT token to rapidly create 10 more properties.
3.  **Action**: Attempt to create the 11th property via the UI or API.
4.  **Expected Result (UI)**: The **New Entry** button is disabled. A warning banner states "You have reached your listing limit".
5.  **Expected Result (API)**: Backend returns `400 Bad Request` with message "Listing limit reached for your STANDARD plan".

**Scenario 3.3: Edit and Soft Delete**
1.  **Action**: Edit the property created in 3.1. Change the price. Save.
2.  **Expected Result**: Price updates successfully.
3.  **Action**: Click the Trash icon to delete the property. Confirm.
4.  **Expected Result**: Property disappears from the UI. 
5.  **Database Verification**: In the database, the property record still exists but `isDeleted` is `true`. The CP Dashboard usage count should decrease.

---

### Module 4: Photo Management (Phase 7)

**Scenario 4.1: Upload and Manage Images**
1.  **Action**: As CP, click Edit on an existing property.
2.  **Action**: Scroll to **Property Media**. Select 2-3 images to upload. Click Update Listing.
3.  **Expected Result**: Images are uploaded (URLs saved).
4.  **Action**: Edit the property again. Hover over an existing image and click the **Trash** icon.
5.  **Expected Result**: Image is removed immediately.
6.  **Action**: Hover over another image and click the **Replace** icon. Select a new image.
7.  **Expected Result**: The image is swapped out successfully without needing to save the entire form.

---

### Module 5: Lead CRM & Interactions (Phase 9 & 10)

**Scenario 5.1: Customer Initiates Lead (OTP Flow)**
1.  **Action**: Open the app in a new browser/incognito (not logged in). Browse to a Property Details page.
2.  **Action**: Click **Contact Seller**.
3.  **Action**: Enter Name (`Test User`), Phone (`9998887770`), and Email. Click **Verify via OTP**.
4.  **Backend Verification**: Check the backend terminal console. The generated 6-digit OTP will be printed there.
5.  **Action**: Enter the OTP from the console into the frontend modal. Submit.
6.  **Expected Result**: Success message "Inquiry Submitted!".

**Scenario 5.2: Duplicate Lead Prevention**
1.  **Action**: Immediately repeat Scenario 5.1 with the exact same phone number on the exact same property.
2.  **Expected Result**: The system handles it gracefully. The backend updates the `updatedAt` timestamp of the existing lead rather than creating a duplicate row.

**Scenario 5.3: CP Manages Lead (CRM)**
1.  **Action**: Login as the CP who owns that property. Navigate to **Leads** (`/cp/leads`).
2.  **Expected Result**: The new lead from `Test User` is visible in the table.
3.  **Action**: Change the status dropdown from `NEW` to `CONTACTED`.
4.  **Expected Result**: Status updates successfully.
5.  **Action**: Click the **Interaction Notes (Sticky Note)** icon on the lead row.
6.  **Action**: Type a note ("Called customer, requested site visit tomorrow") and click Send.
7.  **Expected Result**: The note appears in the history timeline with a timestamp.

---

### Module 6: Expiry & Access Control (Phase 3 & 12)

**Scenario 6.1: Simulating Subscription Expiry**
1.  **Action**: Login as Admin. Go to **Subscriptions**.
2.  **Action**: Assign a *new* plan to the CP, but set both Start Date and End Date to a date in the *past* (e.g., yesterday).
3.  **Expected Result**: Backend correctly processes the update.

**Scenario 6.2: Expiry Enforcement on CP**
1.  **Action**: Login as the CP whose subscription just "expired".
2.  **Expected Result (UI)**: A red warning banner appears: "Your subscription has expired or is inactive".
3.  **Action**: Go to **My Properties**.
4.  **Expected Result**: The **New Entry** button is disabled. The **Edit** and **Delete** icons on existing rows are disabled (greyed out).
5.  **Security Check (API Bypass)**: Attempt to send a `POST /api/v1/properties` request using Postman with the expired CP's token.
6.  **Expected Result (API)**: Backend returns `403 Forbidden` with "Your subscription has expired. Please renew your plan to continue."

**Scenario 6.3: Marketplace Visibility**
1.  **Action**: As an unauthenticated Customer, go to the public **Properties** page (`/properties`).
2.  **Expected Result**: Any properties owned by the expired CP are *hidden* from the public listing, ensuring the platform only displays active inventory.

---

## 4. Security & Edge Case Checklist

*   [ ] **Cross-User Data Access**: Attempt to fetch, edit, or delete a property or lead using a CP token that does not own that resource. Ensure `403 Forbidden` or `404 Not Found`.
*   [ ] **Admin Route Protection**: Attempt to access `/api/v1/admin/*` routes using a CP or Customer JWT. Ensure `403 Forbidden`.
*   [ ] **Data Preservation on Expiry**: Confirm that after a subscription expires, no properties or leads are deleted from the database.
*   [ ] **SQL Injection / XSS**: Test form inputs (Property Title, Lead Notes) with basic payload strings (e.g., `<script>alert(1)</script>`) to ensure data is sanitized or properly escaped on render.
*   [ ] **N+1 Query Checks**: Monitor backend terminal logs (if Prisma query logging is enabled) when viewing the Admin Dashboard or CP Properties list to ensure queries are optimized and joined rather than looping iteratively.

---
*End of Testing Guide*