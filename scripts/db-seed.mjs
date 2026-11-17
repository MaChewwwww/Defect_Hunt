#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import ts from "typescript";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const DEFAULT_BASELINE_SANDBOX_ID = "00000000-0000-4000-8000-000000000001";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const requireFromHere = createRequire(import.meta.url);
const tsModuleCache = new Map();

/**
 * Loads TypeScript domain modules directly from src/ so CLI seeding shares
 * the exact single-source-of-truth dataset in src/lib/domain/seed.ts.
 */
function loadTsModule(tsFilePath) {
  const resolved = path.resolve(tsFilePath);
  if (tsModuleCache.has(resolved)) {
    return tsModuleCache.get(resolved);
  }

  const source = fs.readFileSync(resolved, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: resolved,
  });

  const mod = { exports: {} };
  tsModuleCache.set(resolved, mod.exports);

  const localRequire = (specifier) => {
    if (specifier.startsWith("@/")) {
      return loadTsModule(path.join(ROOT_DIR, "src", `${specifier.slice(2)}.ts`));
    }
    if (specifier.startsWith(".")) {
      return loadTsModule(
        path.resolve(path.dirname(resolved), `${specifier}.ts`)
      );
    }
    return requireFromHere(specifier);
  };

  const compiledFn = vm.runInNewContext(
    `(function(exports, require, module, __filename, __dirname) {\n${outputText}\n})`,
    { console, process, Buffer, Date, Math, JSON, Map, Set, Array, Object }
  );
  compiledFn(mod.exports, localRequire, mod, resolved, path.dirname(resolved));
  tsModuleCache.set(resolved, mod.exports);
  return mod.exports;
}

/**
 * Populates process.env from .env.local / .env without overriding explicit env vars.
 */
function loadEnvFiles() {
  for (const filename of [".env.local", ".env"]) {
    const envPath = path.join(ROOT_DIR, filename);
    if (!fs.existsSync(envPath)) continue;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;

      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && !(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function printHelp() {
  console.log(`Veranda PMS Supabase Seeder & Reset CLI

Usage:
  pnpm db:seed [options]     Seed or re-seed a sandbox in Supabase
  pnpm db:reset [options]    Wipe sandboxes in Supabase and re-seed baseline

Options:
  --sandbox, -s <uuid>       Target sandbox UUID (default: ${DEFAULT_BASELINE_SANDBOX_ID})
  --date <iso>               Anchor ISO timestamp for relative dates (default: now)
  --prune-days <n>           On reset, delete only sandboxes older than <n> days
  --no-seed                  On reset, wipe/prune without seeding baseline afterwards
  --dry-run                  Print resolved actions without modifying Supabase
  --help, -h                 Show this help message
`);
}

function parseCliArgs(rawArgs) {
  const args = rawArgs.filter((token) => token !== "--");
  let mode = "seed";
  let modeExplicit = false;
  let sandboxId = DEFAULT_BASELINE_SANDBOX_ID;
  let anchorDate = new Date();
  let pruneDays = null;
  let noSeed = false;
  let dryRun = false;
  let help = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--no-seed") {
      noSeed = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--sandbox" || arg === "-s") {
      const next = args[++i];
      if (!next || !UUID_RE.test(next)) {
        throw new Error(`Invalid UUID for ${arg}: ${next ?? "(missing)"}`);
      }
      sandboxId = next.toLowerCase();
    } else if (arg === "--date") {
      const next = args[++i];
      const parsed = next ? new Date(next) : null;
      if (!parsed || Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid ISO timestamp for --date: ${next ?? "(missing)"}`);
      }
      anchorDate = parsed;
    } else if (arg === "--prune-days") {
      const next = Number(args[++i]);
      if (!Number.isFinite(next) || next < 0) {
        throw new Error(`Invalid number for --prune-days: ${args[i] ?? "(missing)"}`);
      }
      pruneDays = next;
    } else if (!modeExplicit && (arg === "seed" || arg === "reset")) {
      mode = arg;
      modeExplicit = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return { mode, sandboxId, anchorDate, pruneDays, noSeed, dryRun, help };
}

async function countTableRows(supabase, table, sandboxId) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (sandboxId) {
    query = query.eq("sandbox_id", sandboxId);
  }
  const { count, error } = await query;
  if (error) {
    throw new Error(`Failed counting ${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  loadEnvFiles();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("your-project-ref") ||
    serviceRoleKey.includes("your-supabase-")
  ) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure .env.local or environment variables before running the seeder."
    );
  }

  const { createInitialSandboxDb } = loadTsModule(
    path.join(ROOT_DIR, "src", "lib", "domain", "seed.ts")
  );
  const seedDb = createInitialSandboxDb(opts.sandboxId, opts.anchorDate);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const targetHost = new URL(supabaseUrl).host;
  console.log(`Target Supabase: ${targetHost}`);
  console.log(`Action: ${opts.mode}${opts.dryRun ? " (dry-run)" : ""}`);

  if (opts.dryRun) {
    const currentSandboxes = await countTableRows(supabase, "sandboxes", null);
    console.log(`Existing sandboxes in DB: ${currentSandboxes}`);
    if (opts.mode === "reset") {
      console.log(
        opts.pruneDays !== null
          ? `Would prune sandboxes with last_reset_at older than ${opts.pruneDays} day(s).`
          : "Would wipe ALL existing sandboxes (cascading across all tenant tables)."
      );
    }
    if (!opts.noSeed) {
      const itemCount = seedDb.reservations.reduce(
        (sum, r) => sum + r.items.length,
        0
      );
      console.log(
        `Would seed sandbox ${opts.sandboxId} (anchor=${opts.anchorDate.toISOString()}): ` +
          `${seedDb.users.length} users, ${seedDb.roomsPackages.length} rooms/packages, ` +
          `${seedDb.allotmentAdjustments.length} adjustments, ${seedDb.guests.length} guests, ` +
          `${seedDb.reservations.length} reservations, ${itemCount} reservation items.`
      );
    }
    return;
  }

  if (opts.mode === "reset") {
    if (opts.pruneDays !== null) {
      const cutoffIso = new Date(
        Date.now() - opts.pruneDays * 86400 * 1000
      ).toISOString();
      const { count, error } = await supabase
        .from("sandboxes")
        .delete({ count: "exact" })
        .lt("last_reset_at", cutoffIso);
      if (error) {
        throw new Error(`Failed pruning sandboxes: ${error.message}`);
      }
      console.log(
        `Pruned ${count ?? 0} stale sandbox(es) older than ${opts.pruneDays} day(s).`
      );
    } else {
      const { count, error } = await supabase
        .from("sandboxes")
        .delete({ count: "exact" })
        .not("id", "is", null);
      if (error) {
        throw new Error(`Failed clearing sandboxes: ${error.message}`);
      }
      console.log(`Cleared ${count ?? 0} sandbox(es) from Supabase.`);
    }
  }

  if (!opts.noSeed) {
    const { error } = await supabase.rpc("reset_veranda_sandbox", {
      p_sandbox_id: opts.sandboxId,
      p_state_json: seedDb,
    });
    if (error) {
      throw new Error(`reset_veranda_sandbox RPC failed: ${error.message}`);
    }

    const summary = {
      users: await countTableRows(supabase, "users", opts.sandboxId),
      rooms_packages: await countTableRows(
        supabase,
        "rooms_packages",
        opts.sandboxId
      ),
      allotment_adjustments: await countTableRows(
        supabase,
        "allotment_adjustments",
        opts.sandboxId
      ),
      guests: await countTableRows(supabase, "guests", opts.sandboxId),
      reservations: await countTableRows(
        supabase,
        "reservations",
        opts.sandboxId
      ),
      reservation_items: await countTableRows(
        supabase,
        "reservation_items",
        opts.sandboxId
      ),
      sandbox_snapshots: await countTableRows(
        supabase,
        "sandbox_snapshots",
        opts.sandboxId
      ),
    };
    console.log(`Seeded sandbox ${opts.sandboxId} (anchor=${opts.anchorDate.toISOString()}):`);
    console.log(JSON.stringify(summary, null, 2));
  }

  const totalSandboxes = await countTableRows(supabase, "sandboxes", null);
  console.log(`Active sandboxes in database: ${totalSandboxes}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
