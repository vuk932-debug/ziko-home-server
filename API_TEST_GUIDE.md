# ZikoHome API Test Guide

This document lists all the active API endpoints for the ZikoHome platform, organized by module.

**Base URL:** `http://localhost:5001/api/v1` (Default local)

---

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| POST | `/register` | Register a new Customer | `{ "name": "...", "email": "...", "phone": "...", "password": "..." }` |
| POST | `/login` | Login (Admin, CP, Customer) | `{ "email": "...", "password": "..." }` |
| POST | `/logout` | Terminate session | N/A |
| POST | `/refresh` | Refresh access token | `{ "refreshToken": "..." }` |
| POST | `/otp/send` | Send OTP for mobile login | `{ "phone": "..." }` |
| POST | `/otp/verify` | Verify OTP and login/register | `{ "phone": "...", "code": "...", "name": "..." }` |

---

## 2. Admin Module (`/admin`)
*Requires Admin Role*

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| GET | `/analytics` | Get platform-wide metrics | N/A |
| GET | `/users` | List all users | N/A |
| PATCH | `/users/:id/role` | Change user role (Phase 1 Fix) | `{ "role": "CP" }` |
| DELETE | `/users/:id` | Delete user identity | N/A |
| POST | `/users/cp` | Onboard new CP with generated creds | `{ "name": "...", "email": "...", "phone": "..." }` |
| GET | `/clients` | List CPs with subscription status | N/A |
| PATCH | `/clients/:id/status` | Toggle CP active/inactive | `{ "isActive": true }` |
| GET | `/clients/:id/activity` | Get CP listings/leads metrics | N/A |
| GET | `/properties` | List all platform properties | N/A |
| PUT | `/properties/:id/feature` | Toggle featured status | `{ "featured": true }` |
| DELETE | `/properties/:id` | Soft delete property | N/A |

---

## 3. Subscription System (`/subscriptions`)

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| POST | `/assign` | *Admin Only:* Assign plan to CP | `{ "userId": "...", "planType": "PRO", "startDate": "...", "endDate": "..." }` |
| GET | `/me` | *CP Only:* Get own subscription info | N/A |

---

## 4. Property System (`/properties`)

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| GET | `/` | Get public listings (Paginated) | Query: `?page=1&limit=10&city=...` |
| GET | `/suggest` | Search suggestions | Query: `?q=...` |
| GET | `/:slug` | Get property details by slug | N/A |
| POST | `/` | *CP Only:* Create new listing | FormData: `title, price, images[], ...` |
| POST | `/:id/refresh` | *CP Only:* Bump listing to top | N/A |
| PUT | `/:id/status` | *Admin Only:* Approve/Reject | `{ "status": "approved" }` |

---

## 5. CP Module (`/cp`)
*Requires CP Role*

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| GET | `/dashboard` | Get CP usage & lead stats | N/A |
| GET | `/properties` | Get CP's own listings | N/A |
| PUT | `/properties/:id` | Update listing | FormData: `...` |
| DELETE | `/properties/:id` | Remove listing | N/A |
| PUT | `/properties/:id/sold` | Mark asset as sold | N/A |
| PUT | `/properties/:id/boost` | *Premium:* Feature listing | N/A |

---

## 6. Lead System (`/leads`)

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| POST | `/send-otp` | Send OTP for lead verification | `{ "phone": "..." }` |
| POST | `/verify-otp` | Verify OTP and create lead | `{ "phone": "...", "code": "...", "propertyId": "...", "name": "..." }` |
| GET | `/cp` | *CP Only:* Fetch assigned leads | N/A |
| PATCH | `/:id/status` | *CP Only:* Update lead status | `{ "status": "CONTACTED" }` |
| POST | `/:id/notes` | *CP Only:* Add CRM note | `{ "note": "..." }` |
| GET | `/:id/notes` | *CP Only:* Get lead history | N/A |

---

## 7. Customer / User Profile (`/customers`)

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| GET | `/profile` | Get own profile details | N/A |
| PUT | `/profile` | Update profile | `{ "name": "..." }` |
