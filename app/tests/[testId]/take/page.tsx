import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExamShell } from "@/components/exam/exam-shell";
import { findPublishedTest, loadStudentQuestions } from "@/lib/data/test-repository";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cookies } from "next/headers";

export const metadata: Metadata = { title: "Шалгалт өгч байна", robots: { index: false, follow: false } };

async function getAuthState() {
  // Mock mode (no database, as in CI): browser tests opt into the school/class monitoring path with a cookie.
  if (!isSupabaseConfigured()) return { isAuthenticated: true, monitored: (await cookies()).get("e2e-monitored")?.value === "1" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAuthenticated: false, monitored: false };
  // Fullscreen and tab-leave monitoring only applies to students a school or teacher can see.
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("school_id").eq("id", user.id).maybeSingle(),
    supabase.from("classroom_students").select("classroom_id", { count: "exact", head: true }).eq("student_id", user.id),
  ]);
  return { isAuthenticated: true, monitored: Boolean(profile?.school_id) || (count ?? 0) > 0 };
}

export default async function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const [test, questions, authState] = await Promise.all([
    findPublishedTest(testId),
    loadStudentQuestions(testId),
    getAuthState(),
  ]);
  if (!test) notFound();
  return <ExamShell test={test} questions={questions} isAuthenticated={authState.isAuthenticated} monitored={authState.monitored}/>;
}
