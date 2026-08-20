import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listPublishedTests } from "@/lib/data/test-repository";
import { getStudentHistory } from "@/lib/data/student-history";

export async function getPortalData() {
  if (!isSupabaseConfigured()) return { profile: { full_name: "Сурагч", avatar_url: null }, email: "", tests: await listPublishedTests(), attempts: await getStudentHistory(), questions: [] };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  const [profileResult, tests, attempts, questionsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, role").eq("id", user.id).single(),
    listPublishedTests(), getStudentHistory(),
    supabase.from("student_support_questions").select("id, subject, message, status, answer, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);
  if (profileResult.data?.role === "admin") redirect("/admin");
  return { profile: profileResult.data ?? { full_name: null, avatar_url: null }, email: user.email ?? "", tests, attempts, questions: questionsResult.data ?? [] };
}
