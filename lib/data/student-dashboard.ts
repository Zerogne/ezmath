import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getStudentHistory, type HistoryAttempt } from "@/lib/data/student-history";
import { listPublishedTests } from "@/lib/data/test-repository";
import type { Test } from "@/types/exam";

export type StudentDashboardData = {
  name: string;
  email: string;
  avatarUrl: string | null;
  attempts: HistoryAttempt[];
  tests: Test[];
};

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  if (!isSupabaseConfigured()) return { name: "Сурагч", email: "", avatarUrl: null, attempts: [], tests: await listPublishedTests() };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, attempts, tests] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, role").eq("id", user.id).maybeSingle(),
    getStudentHistory(),
    listPublishedTests(),
  ]);
  if (profile?.role === "admin") redirect("/admin");

  return {
    name: profile?.full_name?.trim() || user.email?.split("@")[0] || "Сурагч",
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    attempts,
    tests,
  };
}
