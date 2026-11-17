import { NextRequest, NextResponse } from "next/server";
import { handleSandboxAction } from "@/lib/supabase/server-sandbox";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    sandboxId?: string;
  };
  const sandboxId = body.sandboxId || crypto.randomUUID();
  const result = await handleSandboxAction("reset", sandboxId);
  return NextResponse.json(result);
}
