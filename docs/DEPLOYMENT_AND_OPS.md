# Deployment and Operations Runbook

**Status:** Approved operational baseline (Milestone M0).  
**Target Platforms:** Vercel (Frontend & Serverless API) + Supabase Cloud (PostgreSQL 17).

---

## 1. Environment Variables Contract (`.env.example`)

Commit `.env.example` with safe placeholders only. Configure real credentials in local `.env.local` (gitignored) and in the Vercel Project Settings dashboard:

```ini
# Application Metadata
NEXT_PUBLIC_APP_NAME="Veranda PMS"
NEXT_PUBLIC_COMPANY_NAME="Solstice Bay Resort & Villas"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_TIMEZONE="Asia/Manila"

# Supabase Connection (Public Browser + Server Route Handlers)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

---

## 2. Supabase Provisioning & Database Setup

1. Create a new Supabase project (`veranda-pms-defect-hunt`) in the Singapore (`ap-southeast-1`) region for lowest latency to Quezon City (`Asia/Manila`).
2. Apply the SQL schema migration (`supabase/migrations/0001_veranda_pms_schema.sql`), which creates:
   - Tables: `sandboxes`, `users`, `rooms_packages`, `allotment_adjustments`, `guests`, `reservations`, `reservation_items`, `password_reset_tokens`.
   - Indexes on `(sandbox_id, ...)`.
   - Stored procedure `reset_veranda_sandbox(p_sandbox_id UUID, p_anchor_date TIMESTAMPTZ)` that atomically resets a single browser's `sandbox_id` slice without locking or touching any other contestant's rows.
3. Verify the RPC function in the Supabase SQL Editor:
   ```sql
   SELECT reset_veranda_sandbox('00000000-0000-4000-8000-000000000001'::uuid, now());
   ```

---

## 3. Vercel Deployment Procedure

1. Connect the GitHub repository to Vercel.
2. Set Framework Preset to **Next.js**, Install Command to `corepack pnpm install`, and Build Command to `corepack pnpm build`.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables for Production and Preview environments.
4. Deploy and run the post-deployment smoke check:
   - Open `/login` in a browser set to `Asia/Manila` (`UTC+8`).
   - Click **Reset demo data** in the bottom-right footer.
   - Sign in with `admin@verandapms.test` / `Admin@123`.
   - Verify Dashboard KPIs, `/rooms`, `/reservations`, `/guests`, `/reports`, `/users`, and `/settings`.

---

## 4. Live Competition Operations (PUPQC BSIT Foundation Month)

### Before the Event Round Starts
1. Run `pnpm test:e2e` against the deployed preview/production URL to verify all 60 planted defects (`VH-01`..`VH-60`) reproduce cleanly.
2. Distribute only the **Live URL** and **Demo Account Credentials** (`admin@verandapms.test`, `staff@verandapms.test`, `former@verandapms.test`) to contestants.
3. **Never share** `docs/DEFECT_CATALOG.md` or the generated `Veranda_PMS_Defect_List.docx` with contestants; provide it exclusively to official event judges and validators.

### During the Competition
- Contestants can click **Reset demo data** in the footer of the `/login` page at any time if they corrupt their own sandbox data (e.g., after testing `VH-12` Admin self-deactivation, `VH-46` deleting Daniel Cruz, or `VH-29` mutating room rates).
- Because each browser has a unique `sandbox_id`, a contestant resetting their data or deleting records has zero impact on any other contestant in the laboratory or auditorium.

### CLI Seeder & Full Database Reset

Use [scripts/db-seed.mjs](../scripts/db-seed.mjs) (via `.env.local` `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) to seed or reset Supabase directly from the terminal:

```bash
# Re-seed the canonical baseline sandbox (00000000-0000-4000-8000-000000000001)
pnpm db:seed

# Wipe all sandboxes and re-seed a clean baseline sandbox
pnpm db:reset

# Optional: prune only stale sandboxes older than 7 days and re-seed baseline
pnpm db:reset -- --prune-days 7

# Optional: inspect actions without mutating Supabase
pnpm db:reset -- --dry-run
```

### Post-Round Sandbox Cleanup
- After the competition concludes, prune old sandbox slices via `pnpm db:reset -- --prune-days 7` or in SQL:
  ```sql
  DELETE FROM sandboxes WHERE last_reset_at < now() - interval '7 days';
  ```
