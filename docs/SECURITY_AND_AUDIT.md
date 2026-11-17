# Security and Access Control Specification

**Status:** Approved security and defect-boundary baseline (Milestone M0).  
**Context:** **Veranda PMS** is a QA competition platform built for the **PUPQC BSIT Foundation Month "Defect Hunt"**. It implements a dual security model:
1. **Infrastructure & Multi-Contestant Isolation Security (Strictly Enforced)**: Protects Supabase credentials, isolates contestant sandboxes (`sandbox_id`), and prevents cross-contestant interference or abuse.
2. **Application-Layer Security Defects (Intentionally Planted)**: Implements the 11 documented security defects (`VH-03`, `VH-04`, `VH-07`, `VH-08`, `VH-09`, `VH-10`, `VH-11`, `VH-13`, `VH-14`, `VH-15`, `VH-52`) in a safe, browser-scoped manner so contestants can discover and report them without compromising the server or other contestants.

---

## 1. Infrastructure & Multi-Contestant Isolation Safeguards

These infrastructure boundaries are **non-negotiable** and never weakened by planted defects:

1. **Tenant Isolation by `sandbox_id`**:
   - Every Supabase query and mutation requires an explicit `sandbox_id` UUID (`WHERE sandbox_id = $1`).
   - A contestant tampering with `localStorage`, executing stored XSS (`VH-15`), escalating their role to `admin` (`VH-13`), or deleting records (`VH-11`, `VH-46`) only ever mutates their own `sandbox_id` slice and their own browser's `veranda.v1.db`.
2. **Contained Stored XSS (`VH-15`)**:
   - The stored XSS defect on `/reservations/[id]/folio` renders the reservation's `notes` field unescaped within that contestant's own sandbox folio view. Because `notes` are scoped to the contestant's `sandbox_id`, a payload entered by Contestant A can never execute in Contestant B's browser.
3. **Environment Variable Protection**:
   - `SUPABASE_SERVICE_ROLE_KEY` (if used by `/api/sandbox/*` route handlers) remains strictly server-side in Vercel environment variables and is never prefixed with `NEXT_PUBLIC_`.
   - `.env.local` is gitignored; `.env.example` contains only safe placeholders.

---

## 2. Canonical Role-Based Access Control (RBAC) vs. Planted Security Defects

| Security Control Area | Canonical Expected Rule (`FRS_NFRS.md`) | Planted Defect Override (`DEFECT_CATALOG.md`) |
|---|---|---|
| **Login Error Messaging** | Return identical `"Invalid email or password."` for both unknown email and wrong password. | **`VH-03` (Medium)**: Unknown email returns `"Invalid email or password."`; existing email with wrong password returns `"Incorrect email or password."` (account enumeration). |
| **Brute-Force Lockout** | Lock account for 5 minutes after 5 failed password attempts. | **`VH-04` (Hard)**: Displays `"Too many attempts, try again later."` on the 5th failure, but entering the valid password on the next attempt logs in immediately. |
| **Password Reset Token Lifecycle** | Single-use reset token invalidated immediately upon password change. | **`VH-07` (Hard)**: Reset link remains reusable multiple times until its 30-minute expiration timestamp. |
| **Session Storage Scope** | Unchecked `"Remember me"` uses tab-scoped `sessionStorage`; checked uses `localStorage`. | **`VH-08` (Medium)**: Session is always written to `localStorage` (`veranda.v1.session`) even when `"Remember me"` is unchecked. |
| **Deactivated Account Enforcement** | Accounts with `is_active = false` (`former@verandapms.test`) are always blocked from signing in. | **`VH-09` (Medium)**: Blocked when `"Remember me"` is unchecked, but login **succeeds** when `"Remember me"` is ticked. |
| **Direct Route Guard on `/users`** | `/users` is restricted to `admin`; `staff` navigating to `/users` is denied or redirected. | **`VH-10` (Medium)**: Sidebar hides the `Users` link for `staff`, but typing `/users` directly in the address bar opens the fully functional Users page. |
| **Action-Level Guard on Room Deletion** | `staff` cannot delete Rooms/Packages on any screen. | **`VH-11` (Medium)**: `/rooms` hides the delete button for `staff`, but `/rooms/[id]` (detail page) renders the Delete button and allows `staff` to delete the room/package. |
| **Session Role Integrity** | Resolve user role from the authoritative user record on load/navigation. | **`VH-13` (Hard)**: Editing `veranda.v1.session` in `localStorage` from `"role":"staff"` to `"role":"admin"` and reloading grants the `Users` menu and room delete buttons. |
| **Password Storage Format** | Store only salted password hashes in database/storage records. | **`VH-14` (Hard)**: `veranda.v1.db > users` stores plaintext passwords (`"password":"Admin@123"`). |
| **Output Encoding on Folio Print** | Escape all user-supplied text (`notes`) across all views. | **`VH-15` (Hard)**: Reservation `notes` are escaped on `/reservations/[id]`, but rendered unescaped on `/reservations/[id]/folio` (stored XSS when clicking `"View folio"`). |
| **Current Password Verification** | Settings > Change Password verifies `currentPassword` before updating password. | **`VH-52` (Medium)**: Entering a wrong `Current password` with a valid new password and confirmation still updates the password. |
