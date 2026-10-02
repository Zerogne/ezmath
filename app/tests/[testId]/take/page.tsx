import { notFound } from "next/navigation";
import { ExamShell } from "@/components/exam/exam-shell";
import { findPublishedTest, loadStudentQuestions } from "@/lib/data/test-repository";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
export default async function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params;
  const [test, questions, isAuthenticated] = await Promise.all([
    findPublishedTest(testId),
    loadStudentQuestions(testId),
    isSupabaseConfigured() ? createClient().then(async (supabase) => Boolean((await supabase.auth.getUser()).data.user)) : Promise.resolve(true),
  ]);
  if (!test) notFound();
  return <ExamShell test={test} questions={questions} isAuthenticated={isAuthenticated}/>;
}
