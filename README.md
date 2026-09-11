# AMTMP Membership Management System
**Association of Medical and Traditional Medicine Practitioners**

A lightweight, production-ready, and secure membership management system built specifically for the **Association of Medical and Traditional Medicine Practitioners (AMTMP)**.

---

## 1. Technology Stack

* **Frontend:** React 18, Vite, TypeScript, React Router
* **Backend:** Node.js, Express, TypeScript
* **Database & ORM:** PostgreSQL, Drizzle ORM
* **Authentication:** Secure cookie-based session authentication with strict dual-role separation
* **Security:** `bcryptjs` (salt rounds: 12), `helmet`, `express-rate-limit`, secure HTTP-only cookies
* **Target Hosting:** Netlify (Static build + Netlify Functions via `serverless-http`)

---

## 2. Project Architecture

```
amtmp-membership-system/
├── .env.example              # Environment variables template (no secrets)
├── .gitignore                # Git ignore rules for node_modules, .env, dist, etc.
├── netlify.toml              # Netlify build, redirects, and serverless functions configuration
├── package.json              # Project dependencies and lifecycle scripts
├── tsconfig.json             # Frontend TypeScript configuration
├── tsconfig.server.json      # Backend TypeScript configuration
├── drizzle.config.ts         # Drizzle ORM configuration
├── server/
│   ├── index.ts              # Local Express HTTP server entry point (port 5000)
│   ├── app.ts                # Express application setup, security headers, middleware & routes
│   ├── config.ts             # Centralized environment configuration and validation
│   ├── db/
│   │   ├── index.ts          # Database connection (PostgreSQL / Embedded PGlite fallback)
│   │   ├── schema.ts         # Drizzle schema (administrators, member_accounts, members, sessions, registration_sequences)
│   │   ├── seed.ts           # Baseline seed data for initial testing
│   │   └── migrate.ts        # Database schema initialization runner
│   ├── auth/
│   │   ├── session.ts        # Cryptographic session tokens and cookie handling
│   │   ├── passwords.ts      # Secure password hashing (bcryptjs) and verification
│   │   └── middleware.ts     # requireAuth, requireAdmin, requireMember guards
│   ├── services/
│   │   └── registrationNumber.ts # Concurrency-safe AMTMP-YY-XXXX registration number generator
│   ├── routes/
│   │   ├── health.ts         # /api/health endpoint
│   │   ├── publicMembers.ts  # /api/members/search public practitioner verification
│   │   ├── adminAuth.ts      # /api/admin/auth/* (login, logout, me, dashboard summary)
│   │   └── memberAuth.ts     # /api/member/auth/* (register, login, logout, me)
│   └── middleware/
│       ├── errorHandler.ts   # Safe centralized error handler (no stack trace leaks)
│       └── rateLimiter.ts    # Brute-force protection on authentication endpoints
├── netlify/
│   └── functions/
│       └── api.ts            # Serverless HTTP entry point for Netlify deployment
├── src/                      # Frontend Application (React + Vite)
│   ├── main.tsx              # React DOM entry point
│   ├── App.tsx               # Main routing and navigation
│   ├── assets/
│   │   └── amtmp-logo.svg    # Official AMTMP vector crest
│   ├── components/
│   │   ├── Layout.tsx        # Responsive Header, Navigation, and Footer
│   │   ├── Logo.tsx          # Official crest with automatic fallback
│   │   ├── ProtectedRoute.tsx# Role-based route guard (Admin vs Member)
│   │   ├── ErrorAlert.tsx    # Accessible plain-language error banner
│   │   └── LoadingSpinner.tsx# Accessible loading indicator
│   ├── context/
│   │   └── AuthContext.tsx   # React Authentication Context
│   ├── pages/
│   │   ├── Home.tsx          # Public Homepage with 4 primary action cards & quick search
│   │   ├── Register.tsx      # Public Member Registration form (PENDING status)
│   │   ├── PublicSearch.tsx  # Public Member Verification search page
│   │   ├── AdminLogin.tsx    # Dedicated Administrator login
│   │   ├── MemberLogin.tsx   # Dedicated Practitioner login
│   │   ├── AdminDashboard.tsx# Administrator dashboard foundation
│   │   └── MemberDashboard.tsx# Practitioner status dashboard (Pending, Approved, Rejected)
│   └── services/
│       └── api.ts            # API client with credentials/cookie support
└── tests/
    ├── auth.test.ts          # Authentication, password hashing, dual-role separation tests
    ├── registrationNumber.test.ts # AMTMP-YY-XXXX format & atomic concurrency tests
    ├── schema.test.ts        # Database schema uniqueness and relational integrity tests
    └── step2.test.ts         # Registration, login, status dashboard & public search tests
```

---

## 3. Database Schema

The database uses PostgreSQL with Drizzle ORM:

1. **`administrators`**:
   * `id` (Serial, Primary Key)
   * `name` (Text, Not Null)
   * `email` (Text, Not Null, Unique)
   * `password_hash` (Text, Not Null)
   * `account_status` (Text, Default: 'active')
   * `created_at` & `updated_at` (Timestamps with timezone)

2. **`member_accounts`**:
   * `id` (Serial, Primary Key)
   * `full_name` (Text, Not Null)
   * `email` (Text, Not Null, Unique)
   * `phone` (Text, Unique)
   * `password_hash` (Text, Not Null)
   * `membership_status` (Text, Default: 'pending' — 'pending', 'approved', 'rejected', 'inactive')
   * `rejection_reason` (Text, Nullable)
   * `created_at` & `updated_at` (Timestamps with timezone)

3. **`members`**:
   * `id` (Serial, Primary Key)
   * `member_account_id` (Integer, References `member_accounts.id`, Unique)
   * `registration_number` (Text, Unique, Nullable until approval)
   * `full_name` (Text, Not Null)
   * `passport_photo_ref` (Text, Nullable)
   * `approval_date` (Timestamp with timezone, Nullable)
   * `member_status` (Text, Default: 'active')
   * `created_at` & `updated_at` (Timestamps with timezone)

4. **`sessions`**:
   * `id` (Text, Primary Key — 64-character cryptographically secure token)
   * `user_type` (Text: `'admin'` or `'member_account'`)
   * `user_id` (Integer, Not Null)
   * `ip_address` & `user_agent` (Audit tracking)
   * `expires_at` (Timestamp with timezone, 7-day lifetime)
   * `created_at` (Timestamp with timezone)

5. **`registration_sequences`**:
   * `year` (Integer, Primary Key)
   * `last_sequence` (Integer, Default: 0)
   * `updated_at` (Timestamp with timezone)

---

## 4. Public Member Search & Privacy Rules

* **Searchable By:** Practitioner full name (case-insensitive partial matching) or official AMTMP registration number (e.g. `AMTMP-26-0001`).
* **Active Members Only:** Strictly returns approved, active members holding an issued AMTMP registration number.
* **Strict Exclusions:** Pending applicants, rejected applicants, and inactive practitioners **never appear** in public search.
* **Privacy Guardrails:** The public search endpoint strictly returns ONLY `fullName`, `registrationNumber`, and `memberStatus`. Emails, telephone numbers, passwords, internal database IDs, dues history, and notes are never returned in public responses.

---

## 5. Getting Started (Local Development)

### Prerequisites
* Node.js (v18 or newer)
* npm (v9 or newer)

### Setup Instructions
1. Navigate to the repository:
   ```bash
   cd amtmp-membership-system
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development environment:
   ```bash
   npm run dev
   ```
   * Frontend: `http://localhost:5173`
   * Backend API: `http://localhost:5000`

### Default Baseline Test Credentials
* **Administrator:**
  * Email: `admin@amtmp.org`
  * Password: `AdminPassword2026!`
* **Approved Member:**
  * Email: `member@amtmp.org`
  * Password: `MemberPassword2026!`
  * Registration Number: `AMTMP-26-0001`
* **Sample Rejected Member:**
  * Email: `rejected@amtmp.org`
  * Password: `MemberPassword2026!`

---

## 6. Running Automated Tests

Run the full automated test suite (Vitest):
```bash
npm test
```

Test coverage includes **37 automated tests across 4 test suites**:
* Registration validation, duplicate email/phone rejection, and PENDING status assignment
* Password hashing with bcrypt (12 rounds) and length validation
* Session lifecycle (creation, verification, expiration rejection, logout invalidation)
* Dual-role access control (Admin vs Member isolation)
* Member status dashboard handling (Pending, Approved with registration number, Rejected with reason)
* Public member search verification by name and registration number
* Strict privacy validation ensuring zero sensitive data exposure in public search
