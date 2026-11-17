---
name: supabase-sandbox-ops
description: Guides creating and maintaining Supabase PostgreSQL migrations, the reset_veranda_sandbox RPC, deterministic relative-date seed data, and the localStorage hybrid sandbox mirror.
---

# Supabase & Hybrid Sandbox Operations Skill

Use this skill when working on `supabase/migrations/`, `src/lib/supabase/`, `src/lib/store/`, `src/lib/domain/seed.ts`, or `src/app/api/sandbox/`.

## 1. Per-Browser Sandbox Isolation Contract

Every browser visiting **Veranda PMS** gets a unique `sandbox_id` UUID stored in `localStorage.getItem("veranda.v1.sandbox_id")` (and cookie).
- All Supabase PostgreSQL tables (`users`, `rooms_packages`, `allotment_adjustments`, `guests`, `reservations`, `reservation_items`, `password_reset_tokens`) include `sandbox_id UUID NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE`.
- The client application maintains a live mirror in `localStorage`:
  - `veranda.v1.session`: Active session object (`userId`, `email`, `name`, `role`, `rememberMe`).
  - `veranda.v1.db`: Full sandbox state (`users`, `roomsPackages`, `guests`, `reservations`, `resetTokens`, `allotmentAdjustments`).

## 2. Deterministic Relative-Date Seeding Rules

Whenever a sandbox is initialized or reset (`resetDemoData()`), reservation timestamps (`placed_at`) MUST be computed relative to the current local date in `Asia/Manila` (`UTC+8`):
1. **Today's Reservations (`RSV-2043`, `RSV-2044`, `RSV-2045`)**:
   - Anchored to **today** (`Asia/Manila`) so `VH-19` (Dashboard `"Last 7 days"` range ending yesterday and excluding today's 3 orders/reservations) always produces an exact difference of `3` against Reports `"Last 7 days"`.
2. **1st-of-Last-Month Midnight Reservation (`VH-18` & `VH-44`)**:
   - Place one reservation at exactly `00:30:00+08:00` (`12:30 AM` `Asia/Manila`) on the **1st day of the previous calendar month** (which is `16:30:00Z` on the last day of two months ago in `UTC`).
   - This guarantees that when the Dashboard chart buckets by `UTC` month (`VH-18`), that reservation shifts into the prior month's bar, whereas Reports (bucketing by local calendar month) counts it in last month!
3. **Cancelled Reservation in Last 30 Days (`RSV-2037`)**:
   - Place `RSV-2037` (`status = 'Cancelled'`) `10 days ago` so it falls inside `"Last 30 days"` (for `VH-16` Total Revenue and `VH-20` ABV) but outside `"Last 7 days"`.

## 3. Reset Demo Data Execution Order

When the user clicks `"Reset demo data"` in the login footer:
1. Generate fresh canonical seed state anchored to `now()`.
2. Write the fresh state to `localStorage.setItem("veranda.v1.db", JSON.stringify(seedDb))`.
3. Remove `localStorage.removeItem("veranda.v1.session")` and `sessionStorage.removeItem("veranda.v1.session")`.
4. Asynchronously call `POST /api/sandbox/reset` with `{ sandboxId }` so the Supabase PostgreSQL slice is reset in tandem.
5. Reset theme to `'dark'` and display a toast notification (`"Demo data has been reset to original seed values."`).
