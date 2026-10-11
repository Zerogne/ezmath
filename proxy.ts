import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieOptions } from "@supabase/ssr";

const LAST_ACTIVITY_COOKIE = "ezmath-last-activity";
const IDLE_TIMEOUT_SECONDS = 24 * 60 * 60;

export async function proxy(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => { cookies.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  // getClaims verifies the JWT locally (asymmetric signing keys), avoiding an Auth server round trip on every request.
  // Pages still call getUser() for their own trusted identity checks.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const now = Math.floor(Date.now() / 1000);
  const lastActivity = Number(request.cookies.get(LAST_ACTIVITY_COOKIE)?.value);

  if (user && Number.isFinite(lastActivity) && now - lastActivity > IDLE_TIMEOUT_SECONDS) {
    await supabase.auth.signOut();
    request.cookies.delete(LAST_ACTIVITY_COOKIE);
    response.cookies.delete(LAST_ACTIVITY_COOKIE);
    return response;
  }

  if (user) {
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: IDLE_TIMEOUT_SECONDS * 2 };
    request.cookies.set(LAST_ACTIVITY_COOKIE, String(now));
    response.cookies.set(LAST_ACTIVITY_COOKIE, String(now), options);
  } else {
    request.cookies.delete(LAST_ACTIVITY_COOKIE);
    response.cookies.delete(LAST_ACTIVITY_COOKIE);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
