import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listPublishedTests } from "@/lib/data/test-repository";
import { getStudentHistory } from "@/lib/data/student-history";
import type { PlanCode } from "@/lib/payments/plans";

export type StudentPlan = { code: PlanCode; status: "free" | "trialing" | "active"; periodStart: string | null; periodEnd: string | null };

export async function getPortalData() {
  if (!isSupabaseConfigured()) return { profile: { full_name: "Сурагч", avatar_url: null }, email: "", plan: freePlan(), tests: await listPublishedTests(), attempts: await getStudentHistory(), questions: [] };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const [profileResult, subscriptionResult, tests, attempts, questionsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, role").eq("id", user.id).single(),
    supabase.from("student_subscriptions").select("plan_code, status, current_period_start, current_period_end").eq("user_id", user.id).in("status", ["trialing", "active"]).order("provider_updated_at", { ascending: false }).limit(1).maybeSingle(),
    listPublishedTests(), getStudentHistory(),
    supabase.from("student_support_questions").select("id, subject, message, status, answer, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (profileResult.data?.role === "admin") redirect("/admin");
  const subscription = subscriptionResult.data;
  const current = subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());
  const plan: StudentPlan = current ? { code: subscription.plan_code, status: subscription.status, periodStart: subscription.current_period_start, periodEnd: subscription.current_period_end } : freePlan();
  return { profile: profileResult.data ?? { full_name: null, avatar_url: null }, email: user.email ?? "", plan, tests, attempts, questions: questionsResult.data ?? [] };
}

function freePlan(): StudentPlan { return { code: "free", status: "free", periodStart: null, periodEnd: null }; }
