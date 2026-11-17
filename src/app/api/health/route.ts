import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Veranda PMS",
    company: "Solstice Bay Resort & Villas",
    supabaseConnected: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
