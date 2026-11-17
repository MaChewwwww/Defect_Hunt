import { createServerSupabaseClient, isSupabaseConfigured } from "./client";
import { createInitialSandboxDb } from "@/lib/domain/seed";
import type { SandboxDatabase } from "@/types/domain";

export async function handleSandboxAction(
  action: "init" | "sync" | "reset",
  sandboxId: string,
  state?: SandboxDatabase
): Promise<{
  ok: boolean;
  sandboxId: string;
  mode: "supabase" | "local-mirror";
  state: SandboxDatabase;
}> {
  const supabase = createServerSupabaseClient();

  if (action === "reset") {
    const freshSeed = createInitialSandboxDb(sandboxId, new Date());
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error } = await supabase.rpc("reset_veranda_sandbox", {
          p_sandbox_id: sandboxId,
          p_state_json: freshSeed,
        });
        if (!error) {
          return { ok: true, sandboxId, mode: "supabase", state: freshSeed };
        }
      } catch {
        // Fallback smoothly to local mirror if Supabase RPC isn't provisioned yet
      }
    }
    return { ok: true, sandboxId, mode: "local-mirror", state: freshSeed };
  }

  if (action === "sync" && state) {
    if (supabase && isSupabaseConfigured()) {
      try {
        const { error: sandboxError } = await supabase.from("sandboxes").upsert({
          id: sandboxId,
          last_reset_at: new Date().toISOString(),
        });
        if (!sandboxError) {
          const { error: snapshotError } = await supabase
            .from("sandbox_snapshots")
            .upsert({
              sandbox_id: sandboxId,
              state_json: state,
              updated_at: new Date().toISOString(),
            });
          if (!snapshotError) {
            return { ok: true, sandboxId, mode: "supabase", state };
          }
        }
      } catch {
        // Graceful fallback
      }
    }
    return { ok: true, sandboxId, mode: "local-mirror", state };
  }

  // init
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error: selectError } = await supabase
        .from("sandbox_snapshots")
        .select("state_json")
        .eq("sandbox_id", sandboxId)
        .maybeSingle();

      if (!selectError && data?.state_json) {
        return {
          ok: true,
          sandboxId,
          mode: "supabase",
          state: data.state_json as SandboxDatabase,
        };
      }

      if (!selectError) {
        const freshSeed = createInitialSandboxDb(sandboxId, new Date());
        const { error: rpcError } = await supabase.rpc("reset_veranda_sandbox", {
          p_sandbox_id: sandboxId,
          p_state_json: freshSeed,
        });
        if (!rpcError) {
          return { ok: true, sandboxId, mode: "supabase", state: freshSeed };
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  const fallbackSeed = state ?? createInitialSandboxDb(sandboxId, new Date());
  return { ok: true, sandboxId, mode: "local-mirror", state: fallbackSeed };
}
