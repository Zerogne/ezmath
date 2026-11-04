import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** Best-effort client IP. On Vercel, x-forwarded-for is set by the platform and its first entry is the client. */
export async function clientIp() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

/**
 * Counts one request against `limit` per `windowSeconds` for `bucket:id` (fixed window, stored in Postgres).
 * Returns false when the caller is over the limit. Fails open when the limiter itself is unavailable,
 * so a database hiccup never locks every student out of signing in.
 */
export async function rateLimit(bucket: string, id: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", { p_key: `${bucket}:${id.toLowerCase()}`, p_limit: limit, p_window_seconds: windowSeconds });
  if (error) {
    console.error("Rate limiter unavailable", { bucket, code: error.code });
    return true;
  }
  return data === true;
}

export const RATE_LIMIT_MESSAGE = "Хэт олон оролдлого хийлээ. Хэдэн минутын дараа дахин оролдоно уу.";
