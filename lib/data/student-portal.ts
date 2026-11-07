import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/session";
import { listPublishedTests } from "@/lib/data/test-repository";
import { getStudentHistory } from "@/lib/data/student-history";
import type { PlanCode } from "@/lib/payments/plans";
import { GOAL_COLUMNS, goalFromProfile, primaryExam, sortByExam, type StudentGoal } from "@/lib/goals";

export type StudentPlan = { code: PlanCode; status: "free" | "trialing" | "active"; periodStart: string | null; periodEnd: string | null };
export type StudentProfile = { full_name: string | null; avatar_url: string | null; phone: string | null };
export type StudentContext = { userId: string; email: string; profile: StudentProfile; goal: StudentGoal | null; plan: StudentPlan };

function freePlan(): StudentPlan { return { code: "free", status: "free", periodStart: null, periodEnd: null }; }

/**
 * Who the student is, their goal and current plan, with the portal's role and onboarding redirects.
 * Two queries in parallel after a local JWT check, deduplicated per request so every loader can call it.
 */
export const getStudentContext = cache(async (): Promise<StudentContext> => {
  if (!isSupabaseConfigured()) return { userId: "", email: "", profile: { full_name: "Сурагч", avatar_url: null, phone: null }, goal: null, plan: freePlan() };
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  const supabase = await createClient();
  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select(`full_name, avatar_url, role, phone, ${GOAL_COLUMNS}` as const).eq("id", user.id).maybeSingle(),
    supabase.from("student_subscriptions").select("plan_code, status, current_period_start, current_period_end").eq("user_id", user.id).in("status", ["trialing", "active"]).order("current_period_end", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "school_admin") redirect("/school");
  if (profile?.role === "teacher") redirect("/teacher");
  if (profile && !profile.onboarded_at) redirect("/onboarding");
  const current = subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());
  const plan: StudentPlan = current
    ? { code: subscription.plan_code, status: subscription.status === "trialing" ? "trialing" : "active", periodStart: subscription.current_period_start, periodEnd: subscription.current_period_end }
    : freePlan();
  return {
    userId: user.id,
    email: user.email,
    profile: { full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null, phone: profile?.phone ?? null },
    goal: goalFromProfile(profile),
    plan,
  };
});

/** Context plus published tests (ordered by the student's exam) and attempt history, all fetched in parallel. */
export async function getPortalData() {
  const [context, tests, attempts] = await Promise.all([getStudentContext(), listPublishedTests(), getStudentHistory()]);
  return { ...context, tests: sortByExam(tests, primaryExam(context.goal)), attempts };
}
