import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listPublishedTests } from "@/lib/data/test-repository";
import { getStudentHistory } from "@/lib/data/student-history";
import type { PlanCode } from "@/lib/payments/plans";
import { GOAL_COLUMNS, goalFromProfile, primaryExam, sortByExam } from "@/lib/goals";

export type StudentPlan = { code: PlanCode; status: "free" | "trialing" | "active"; periodStart: string | null; periodEnd: string | null };

export async function getPortalData() {
  if (!isSupabaseConfigured()) return { profile: { full_name: "Сурагч", avatar_url: null, phone: null }, goal: null, email: "", plan: freePlan(), tests: await listPublishedTests(), attempts: await getStudentHistory() };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const [profileResult, subscriptionResult, tests, attempts] = await Promise.all([
    supabase.from("profiles").select(`full_name, avatar_url, role, phone, ${GOAL_COLUMNS}` as const).eq("id", user.id).single(),
    supabase.from("student_subscriptions").select("plan_code, status, current_period_start, current_period_end").eq("user_id", user.id).in("status", ["trialing", "active"]).order("provider_updated_at", { ascending: false }).limit(1).maybeSingle(),
    listPublishedTests(), getStudentHistory(),
  ]);
  if (profileResult.data?.role === "admin") redirect("/admin");
  if (profileResult.data?.role === "school_admin") redirect("/school");
  if (profileResult.data?.role === "teacher") redirect("/teacher");
  if (profileResult.data && !profileResult.data.onboarded_at) redirect("/onboarding");
  const goal = goalFromProfile(profileResult.data);
  const subscription = subscriptionResult.data;
  const current = subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());
  const plan: StudentPlan = current ? { code: subscription.plan_code, status: subscription.status, periodStart: subscription.current_period_start, periodEnd: subscription.current_period_end } : freePlan();
  return { profile: profileResult.data ?? { full_name: null, avatar_url: null, phone: null }, goal, email: user.email ?? "", plan, tests: sortByExam(tests, primaryExam(goal)), attempts };
}

function freePlan(): StudentPlan { return { code: "free", status: "free", periodStart: null, periodEnd: null }; }
