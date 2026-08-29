import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const admin = createAdminClient();
      const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).single();
      let effectiveRole = profile?.role ?? "student";
      if (url.searchParams.get("setRole") === "1" && profile?.role !== "admin") {
        await admin.from("profiles").update({ role: "student", school_id: null }).eq("id", data.user.id);
        effectiveRole = "student";
      }
      const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : effectiveRole === "admin" ? "/admin" : effectiveRole === "school_admin" ? "/school" : effectiveRole === "teacher" ? "/teacher" : "/dashboard";
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", url.origin));
}
