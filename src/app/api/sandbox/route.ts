import { NextRequest, NextResponse } from "next/server";
import { handleSandboxAction } from "@/lib/supabase/server-sandbox";
import type { SandboxDatabase } from "@/types/domain";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: "init" | "sync" | "reset";
      sandboxId?: string;
      state?: SandboxDatabase;
    };
    const sandboxId = body.sandboxId || crypto.randomUUID();
    const action = body.action || "init";
    const result = await handleSandboxAction(action, sandboxId, body.state);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Invalid sandbox request" }, { status: 400 });
  }
}
