import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Free-plan question-bank answers per day (Asia/Ulaanbaatar calendar day). */
export const FREE_DAILY_EXERCISES = 10;

/** True for students with a current paid plan, and for staff roles who review content. */
export async function hasPaidAccess(userId: string): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return true;
  const admin = createAdminClient();
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
    admin.from("student_subscriptions").select("current_period_end").eq("user_id", userId).in("status", ["trialing", "active"]).order("provider_updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (profile && profile.role !== "student") return true;
  return Boolean(subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date()));
}

/** Start of the current day in Mongolia (UTC+8, no DST) as an ISO timestamp. */
export function startOfUlaanbaatarDay(now = new Date()) {
  const shifted = new Date(now.getTime() + 8 * 3_600_000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 8 * 3_600_000).toISOString();
}
