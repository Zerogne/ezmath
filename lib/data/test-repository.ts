import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getStudentQuestions, getTest, tests as mockTests } from "./mock-tests";
import type { StudentQuestion, Test } from "@/types/exam";

const TEST_COLUMNS = "id, exam_type, title, subject, year, variant, duration_minutes, difficulty, test_type, instructions";
function mapTest(row: { id: string; exam_type: "SAT" | "EYESH"; title: string; subject: string; year: number | null; variant: "A" | "B" | "C" | "D" | "E" | null; duration_minutes: number; difficulty: "Easy" | "Medium" | "Hard" | null; test_type: "full" | "practice" | "previous-year"; instructions: string | null }, questionCount = 0): Test { return { id: row.id, title: row.title, description: row.instructions ?? "", examType: row.exam_type, subject: row.subject, year: row.year ?? undefined, variant: row.variant ?? undefined, questionCount, durationMinutes: row.duration_minutes, difficulty: row.difficulty ?? undefined, type: row.test_type }; }

const listFromDatabase = unstable_cache(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("tests").select(TEST_COLUMNS).eq("status", "published").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Published tests could not be loaded.");
  const testIds = data.map((row) => row.id);
  // PostgREST returns at most 1000 rows per request, so question rows are read page by page.
  const counts = new Map<string, number>();
  for (let from = 0; testIds.length; from += 1000) {
    const { data: questionRows, error: countError } = await supabase.from("student_questions").select("test_id").in("test_id", testIds).order("id").range(from, from + 999);
    if (countError) break;
    for (const question of questionRows) counts.set(question.test_id, (counts.get(question.test_id) ?? 0) + 1);
    if (questionRows.length < 1000) break;
  }
  return data.map((row) => mapTest(row, counts.get(row.id) ?? 0));
}, ["published-tests"], { revalidate: 300, tags: ["tests"] });

export async function listPublishedTests() { return isSupabaseConfigured() ? listFromDatabase() : mockTests; }

export async function findPublishedTest(testId: string): Promise<Test | undefined> {
  if (!isSupabaseConfigured()) return getTest(testId);
  const supabase = createPublicClient();
  const [{ data: test }, { count }] = await Promise.all([
    supabase.from("tests").select(TEST_COLUMNS).eq("id", testId).eq("status", "published").maybeSingle(),
    supabase.from("student_questions").select("id", { count: "exact", head: true }).eq("test_id", testId),
  ]);
  return test ? mapTest(test, count ?? 0) : getTest(testId);
}

export async function loadStudentQuestions(testId: string): Promise<StudentQuestion[]> {
  if (!isSupabaseConfigured()) return getStudentQuestions(testId);
  const supabase = createPublicClient();
  const { data: questionRows, error } = await supabase.from("student_questions").select("id, test_id, question_number, question_text, question_type, response_fields, topic, image_url").eq("test_id", testId).order("question_number");
  if (error || !questionRows?.length) return getStudentQuestions(testId);
  const { data: choiceRows } = await supabase.from("student_answer_choices").select("id, question_id, label, text, image_url, sort_order").in("question_id", questionRows.map((question) => question.id)).order("sort_order");
  const choicesByQuestion = new Map<string, { id: string; label: string; text: string; imageUrl?: string }[]>();
  for (const choice of choiceRows ?? []) choicesByQuestion.set(choice.question_id, [...(choicesByQuestion.get(choice.question_id) ?? []), { id: choice.id, label: choice.label, text: choice.text, imageUrl: choice.image_url ?? undefined }]);
  return questionRows.map((question) => ({ id: question.id, testId: question.test_id, questionNumber: question.question_number, questionText: question.question_text, questionType: question.question_type === "multi-blank" ? "multi-blank" as const : "multiple-choice" as const, responseFields: Array.isArray(question.response_fields) ? question.response_fields as { id: string; label: string }[] : [], topic: question.topic ?? undefined, imageUrl: question.image_url ?? undefined, choices: choicesByQuestion.get(question.id) ?? [] }));
}
