import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string };

/**
 * The signed-in user, deduplicated per request.
 * getClaims() verifies the JWT signature locally (asymmetric signing keys), so it costs no Auth round trip,
 * unlike getUser(). The trade-off: a revoked session stays valid until its access token expires (≤ 1 hour).
 * Use getUser() where that matters (auth flows, payments, account changes).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
});
