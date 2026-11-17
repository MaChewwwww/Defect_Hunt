import { NextRequest, NextResponse } from "next/server";
import { handleSandboxAction } from "@/lib/supabase/server-sandbox";
import type { SandboxDatabase } from "@/types/domain";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    sandboxId?: string;
    state?: SandboxDatabase;
  };
  const sandboxId = body.sandboxId || crypto.randomUUID();
  const result = await handleSandboxAction("init", sandboxId, body.state);
  return NextResponse.json(result);
}
