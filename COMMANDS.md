# Veranda PMS Command Reference

Quick reference for development, verification, database seeding/resetting, handout generation, and deployment in **Veranda PMS** (`Solstice Bay Resort & Villas`).

For system architecture and operational runbooks, see [README.md](README.md) and [docs/DEPLOYMENT_AND_OPS.md](docs/DEPLOYMENT_AND_OPS.md).

---

## 1. Setup & Local Development

Requires Node.js (`v22+` recommended) and `pnpm` (`10.30.2` via Corepack).

```bash
# Install dependencies from pnpm-lock.yaml
corepack pnpm install

# Create local environment file from template (Windows PowerShell)
Copy-Item .env.example .env.local

# Create local environment file from template (macOS / Linux / Git Bash)
cp .env.example .env.local

# Start Next.js development server (default: http://localhost:3000)
corepack pnpm dev

# Build optimized production bundle
corepack pnpm build

# Run built production server locally
corepack pnpm start
```

---

## 2. Code Quality, Unit Tests & Playwright E2E

All verification commands below enforce the project's canonical checks and 60-defect E2E contract (`T-VH-01`..`T-VH-60`) under `Asia/Manila` (`UTC+8`).

```bash
# TypeScript type checking
corepack pnpm typecheck

# ESLint check
corepack pnpm lint

# Run Vitest unit suite (tests/unit/defects-and-seed.test.ts)
corepack pnpm test

# Run full Playwright E2E suite (auto-builds & starts localhost:3010)
corepack pnpm test:e2e

# Run a single Playwright E2E spec file
corepack pnpm test:e2e -- tests/e2e/defects/auth-and-users.spec.ts
corepack pnpm test:e2e -- tests/e2e/defects/dashboard-and-rooms.spec.ts
corepack pnpm test:e2e -- tests/e2e/defects/reservations-and-folio.spec.ts
corepack pnpm test:e2e -- tests/e2e/defects/guests-reports-settings.spec.ts
```

### Run Playwright E2E Against Live Vercel Production

When `PLAYWRIGHT_BASE_URL` is set, [playwright.config.ts](playwright.config.ts) skips booting a local server and tests the target URL directly:

```powershell
# Windows PowerShell
$env:PLAYWRIGHT_BASE_URL="https://veranda-pms.vercel.app"
corepack pnpm test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

```bash
# macOS / Linux / Git Bash
PLAYWRIGHT_BASE_URL="https://veranda-pms.vercel.app" corepack pnpm test:e2e
```

---

## 3. Supabase Database Seeder & Reset CLI

[scripts/db-seed.mjs](scripts/db-seed.mjs) uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (or shell env vars) to run `reset_veranda_sandbox` and hydrate all tenant tables (`users`, `rooms_packages`, `allotment_adjustments`, `guests`, `reservations`, `reservation_items`, `password_reset_tokens`, `sandbox_snapshots`).

```bash
# Seed or re-seed all 5 competition group sandboxes (00000000-0000-4000-8000-000000000001..000000000005)
corepack pnpm db:seed

# Seed a specific sandbox UUID
corepack pnpm db:seed -- --sandbox 00000000-0000-4000-8000-000000000099

# Seed using an explicit ISO timestamp anchor for relative dates
corepack pnpm db:seed -- --date 2026-11-17T00:00:00Z

# Wipe ALL sandboxes in Supabase (cascades across all child tables) and re-seed all 5 groups
corepack pnpm db:reset

# Prune only stale sandboxes older than 7 days, then re-seed all 5 groups
corepack pnpm db:reset -- --prune-days 7

# Wipe all sandboxes without seeding afterwards
corepack pnpm db:reset -- --no-seed

# Preview database actions without modifying Supabase
corepack pnpm db:reset -- --dry-run

# Print CLI help
node scripts/db-seed.mjs --help
```

---

## 4. Validator Handout (`.docx`) Generation

Requires Python with `python-docx` installed. Generates [docs/Veranda_PMS_Defect_List.docx](docs/Veranda_PMS_Defect_List.docx) from [docs/DEFECT_CATALOG.md](docs/DEFECT_CATALOG.md) using the template formatting in `docs/example/ShopSphere_Defect_List.docx`.

```bash
python .agents/skills/validator-handout-generator/scripts/generate_docx.py
```

---

## 5. Sandbox API Smoke Checks

Quick checks against either local (`http://localhost:3000`) or live (`https://veranda-pms.vercel.app`):

```bash
# Health check (verifies supabaseConnected boolean)
curl -s https://veranda-pms.vercel.app/api/health

# Initialize or fetch a sandbox slice
curl -s -X POST https://veranda-pms.vercel.app/api/sandbox/init \
  -H "Content-Type: application/json" \
  -d '{"sandboxId":"00000000-0000-4000-8000-000000000001"}'

# Reset a single sandbox slice via Supabase RPC
curl -s -X POST https://veranda-pms.vercel.app/api/sandbox/reset \
  -H "Content-Type: application/json" \
  -d '{"sandboxId":"00000000-0000-4000-8000-000000000001"}'
```

---

## 6. Vercel Deployment & Inspection

Requires `vercel` CLI (authenticated via `vercel login` or `--token`).

```bash
# Check authenticated Vercel user
vercel whoami

# Link workspace to the veranda-pms Vercel project
vercel link --yes --project veranda-pms

# Deploy directly to production
vercel deploy --prod --yes

# Inspect live production deployment metadata
vercel inspect veranda-pms.vercel.app
```
