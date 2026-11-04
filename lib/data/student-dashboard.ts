import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getStudentHistory, type HistoryAttempt } from "@/lib/data/student-history";
import { listPublishedTests } from "@/lib/data/test-repository";
import type { PlanCode } from "@/lib/payments/plans";
import type { Test } from "@/types/exam";
import { GOAL_COLUMNS, goalFromProfile, primaryExam, sortByExam, type StudentGoal } from "@/lib/goals";

export type StudentDashboardData = {
  name: string;
  email: string;
  avatarUrl: string | null;
  planCode: PlanCode;
  planExpiresAt: string | null;
  attempts: HistoryAttempt[];
  tests: Test[];
  goal: StudentGoal | null;
};

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  if (!isSupabaseConfigured()) return { name: "Сурагч", email: "", avatarUrl: null, planCode: "free", planExpiresAt: null, attempts: [], tests: await listPublishedTests(), goal: null };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: subscription }, attempts, tests] = await Promise.all([
    supabase.from("profiles").select(`full_name, avatar_url, role, ${GOAL_COLUMNS}` as const).eq("id", user.id).maybeSingle(),
    supabase.from("student_subscriptions")
      .select("plan_code, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active"])
      .order("provider_updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getStudentHistory(),
    listPublishedTests(),
  ]);
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "school_admin") redirect("/school");
  if (profile?.role === "teacher") redirect("/teacher");
  if (!profile?.onboarded_at) redirect("/onboarding");
  const goal = goalFromProfile(profile);
  const subscriptionIsCurrent = subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());

  return {
    name: profile?.full_name?.trim() || user.email?.split("@")[0] || "Сурагч",
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    planCode: subscriptionIsCurrent ? subscription.plan_code : "free",
    planExpiresAt: subscriptionIsCurrent ? subscription.current_period_end : null,
    attempts,
    tests: sortByExam(tests, primaryExam(goal)),
    goal,
  };
}
