import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const requestedNext = url.searchParams.get("next");
  const requestedRole = url.searchParams.get("role");
  if (requestedRole === "teacher") return NextResponse.redirect(new URL("/register", origin));
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : requestedRole ? "/dashboard" : "";
  const callback = new URL("/auth/callback", origin);
  if (next) callback.searchParams.set("next", next);
  if (requestedRole) { callback.searchParams.set("role", "student"); callback.searchParams.set("setRole", "1"); }
  if (!isSupabaseConfigured()) return NextResponse.redirect(`${origin}/login?error=not-configured`);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.toString(), queryParams: { prompt: "select_account" } } });
  if (error || !data.url) return NextResponse.redirect(`${origin}/login?error=oauth`);
  return NextResponse.redirect(data.url);
}
