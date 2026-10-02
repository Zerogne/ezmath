import { notFound } from "next/navigation";
import { ExamShell } from "@/components/exam/exam-shell";
import { findPublishedTest, loadStudentQuestions } from "@/lib/data/test-repository";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function getAuthState() {
  if (!isSupabaseConfigured()) return { isAuthenticated: true, fullscreenRequired: true };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { isAuthenticated: false, fullscreenRequired: true };
  const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).maybeSingle();
  return { isAuthenticated: true, fullscreenRequired: Boolean(profile?.school_id) };
}

export default async function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const [test, questions, authState] = await Promise.all([
    findPublishedTest(testId),
    loadStudentQuestions(testId),
    getAuthState(),
  ]);
  if (!test) notFound();
  return <ExamShell test={test} questions={questions} isAuthenticated={authState.isAuthenticated} fullscreenRequired={authState.fullscreenRequired}/>;
}
