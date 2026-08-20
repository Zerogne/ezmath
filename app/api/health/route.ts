import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export function GET() { return NextResponse.json({ status: "ok", database: isSupabaseConfigured() ? "configured" : "mock", timestamp: new Date().toISOString() }, { headers: { "cache-control": "no-store" } }); }
