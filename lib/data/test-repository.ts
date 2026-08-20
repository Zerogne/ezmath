import "server-only";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getStudentQuestions, getTest, tests as mockTests } from "./mock-tests";
import type { StudentQuestion, Test } from "@/types/exam";

const TEST_COLUMNS = "id, exam_type, title, subject, year, duration_minutes, difficulty, test_type, instructions";
function mapTest(row: { id: string; exam_type: "SAT" | "EYESH"; title: string; subject: string; year: number | null; duration_minutes: number; difficulty: "Easy" | "Medium" | "Hard" | null; test_type: "full" | "practice" | "previous-year"; instructions: string | null }, questionCount = 0): Test { return { id: row.id, title: row.title, description: row.instructions ?? "", examType: row.exam_type, subject: row.subject, year: row.year ?? undefined, questionCount, durationMinutes: row.duration_minutes, difficulty: row.difficulty ?? undefined, type: row.test_type }; }

const listFromDatabase = unstable_cache(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("tests").select(TEST_COLUMNS).eq("status", "published").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Published tests could not be loaded.");
  return data.map((row) => mapTest(row));
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
  const { data: questionRows, error } = await supabase.from("student_questions").select("id, test_id, question_number, question_text, topic, image_url").eq("test_id", testId).order("question_number");
  if (error || !questionRows?.length) return getStudentQuestions(testId);
  const { data: choiceRows } = await supabase.from("student_answer_choices").select("id, question_id, label, text, sort_order").in("question_id", questionRows.map((question) => question.id)).order("sort_order");
  const choicesByQuestion = new Map<string, { id: string; label: string; text: string }[]>();
  for (const choice of choiceRows ?? []) choicesByQuestion.set(choice.question_id, [...(choicesByQuestion.get(choice.question_id) ?? []), { id: choice.id, label: choice.label, text: choice.text }]);
  return questionRows.map((question) => ({ id: question.id, testId: question.test_id, questionNumber: question.question_number, questionText: question.question_text, topic: question.topic ?? undefined, imageUrl: question.image_url ?? undefined, choices: choicesByQuestion.get(question.id) ?? [] }));
}
