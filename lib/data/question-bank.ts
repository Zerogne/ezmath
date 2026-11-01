import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { placeSatQuestion, satGroupKey, type SatSection } from "@/lib/sat/taxonomy";
import type { Difficulty, StudentQuestion } from "@/types/exam";

export type BankQuestion = { id: string; section: SatSection; group: string; difficulty: Difficulty | null };
export type BankStatus = { answered: boolean; lastCorrect: boolean | null; marked: boolean };
export type BankMode = "all" | "new" | "incorrect" | "marked";
export type BankFilters = { section: SatSection; groups: string[]; difficulties: Difficulty[]; mode: BankMode; count: number };

/** Questions of every published SAT test, placed in the official taxonomy. Questions without a known section are counted, not listed. */
export const loadBankIndex = unstable_cache(async () => {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { questions: [] as BankQuestion[], unplaced: 0 };
  const admin = createAdminClient();
  const { data: tests, error } = await admin.from("tests").select("id, subject").eq("exam_type", "SAT").eq("status", "published");
  if (error) throw new Error("SAT tests could not be loaded.");
  if (!tests.length) return { questions: [] as BankQuestion[], unplaced: 0 };
  const subjects = new Map(tests.map((test) => [test.id as string, test.subject as string]));
  const { rows, error: questionError } = await fetchAll<{ id: string; test_id: string; topic: string | null; difficulty: Difficulty | null }>((from, to) => admin.from("questions").select("id, test_id, topic, difficulty").in("test_id", [...subjects.keys()]).order("id").range(from, to));
  if (questionError) throw new Error("SAT questions could not be loaded.");
  const questions: BankQuestion[] = [];
  let unplaced = 0;
  for (const row of rows) {
    const placement = placeSatQuestion(row.topic, subjects.get(row.test_id) ?? "");
    if (!placement.section) { unplaced += 1; continue; }
    questions.push({ id: row.id, section: placement.section, group: satGroupKey(placement), difficulty: row.difficulty ?? null });
  }
  return { questions, unplaced };
}, ["sat-question-bank"], { revalidate: 300, tags: ["tests"] });

/** True when Postgres/PostgREST reports a missing table, i.e. the progress migration is not applied yet. */
export const isMissingTable = (error: { code?: string } | null) => error?.code === "42P01" || error?.code === "PGRST205";

/**
 * A student's state per question: bank answers win; past mock answers (latest attempt first) fill in the rest,
 * so questions missed or marked in a mock test also show up under "incorrect" and "marked".
 */
export async function loadBankStatus(userId: string) {
  const admin = createAdminClient();
  const status = new Map<string, BankStatus>();
  const { data: attempts } = await admin.from("test_attempts").select("id").eq("user_id", userId).eq("status", "submitted").order("completed_at", { ascending: false }).limit(200);
  if (attempts?.length) {
    const order = new Map(attempts.map((attempt, index) => [attempt.id as string, index]));
    const { rows: answers } = await fetchAll<{ attempt_id: string; question_id: string; is_correct: boolean | null; marked_for_review: boolean }>((from, to) => admin.from("attempt_answers").select("attempt_id, question_id, is_correct, marked_for_review").in("attempt_id", [...order.keys()]).order("id").range(from, to));
    for (const answer of [...answers].sort((a, b) => order.get(a.attempt_id)! - order.get(b.attempt_id)!)) {
      const current = status.get(answer.question_id);
      const answered = answer.is_correct !== null;
      if (!current) status.set(answer.question_id, { answered, lastCorrect: answer.is_correct, marked: answer.marked_for_review });
      else status.set(answer.question_id, { answered: current.answered || answered, lastCorrect: current.answered ? current.lastCorrect : answer.is_correct, marked: current.marked || answer.marked_for_review });
    }
  }
  const { rows: progress, error } = await fetchAll<{ question_id: string; attempts: number; last_correct: boolean | null; marked: boolean }>((from, to) => admin.from("question_bank_progress").select("question_id, attempts, last_correct, marked").eq("user_id", userId).order("question_id").range(from, to));
  if (error && !isMissingTable(error)) console.error("Question bank progress could not be loaded", error);
  for (const row of progress) {
    const mock = status.get(row.question_id);
    status.set(row.question_id, row.attempts > 0 ? { answered: true, lastCorrect: row.last_correct, marked: row.marked } : { answered: mock?.answered ?? false, lastCorrect: mock?.lastCorrect ?? null, marked: row.marked });
  }
  return status;
}

export function matchesFilters(question: BankQuestion, status: BankStatus | undefined, filters: Omit<BankFilters, "count">) {
  if (question.section !== filters.section) return false;
  if (filters.groups.length && !filters.groups.includes(question.group)) return false;
  if (filters.difficulties.length && (!question.difficulty || !filters.difficulties.includes(question.difficulty))) return false;
  if (filters.mode === "new") return !status?.answered;
  if (filters.mode === "incorrect") return status?.answered === true && status.lastCorrect === false;
  if (filters.mode === "marked") return status?.marked === true;
  return true;
}

/** Picks a random practice set for the filters and loads it without answers or explanations. */
export async function selectPracticeSet(filters: BankFilters, userId: string) {
  const [{ questions }, status] = await Promise.all([loadBankIndex(), loadBankStatus(userId)]);
  const pool = questions.filter((question) => matchesFilters(question, status.get(question.id), filters));
  const picked = shuffle(pool).slice(0, filters.count);
  const loaded = await loadStudentQuestionsById(picked.map((question) => question.id));
  const meta = new Map(picked.map((question) => [question.id, question]));
  return {
    poolSize: pool.length,
    questions: loaded.map((question) => ({ question, group: meta.get(question.id)!.group, difficulty: meta.get(question.id)!.difficulty, marked: status.get(question.id)?.marked ?? false })),
  };
}

async function loadStudentQuestionsById(ids: string[]): Promise<StudentQuestion[]> {
  if (!ids.length) return [];
  const admin = createAdminClient();
  const [{ data: rows }, { data: choices }] = await Promise.all([
    admin.from("questions").select("id, test_id, question_text, question_type, response_fields, topic, image_url").in("id", ids),
    admin.from("answer_choices").select("id, question_id, label, text, image_url, sort_order").in("question_id", ids).order("sort_order"),
  ]);
  const choicesByQuestion = new Map<string, StudentQuestion["choices"]>();
  for (const choice of choices ?? []) choicesByQuestion.set(choice.question_id, [...(choicesByQuestion.get(choice.question_id) ?? []), { id: choice.id, label: choice.label, text: choice.text, imageUrl: choice.image_url ?? undefined }]);
  const byId = new Map((rows ?? []).map((row) => [row.id as string, row]));
  return ids.flatMap((id, index) => {
    const row = byId.get(id);
    if (!row) return [];
    const fields = Array.isArray(row.response_fields) ? (row.response_fields as { id: string; label: string }[]).map(({ id: fieldId, label }) => ({ id: fieldId, label })) : [];
    return [{ id: row.id, testId: row.test_id, questionNumber: index + 1, questionText: row.question_text, questionType: row.question_type === "multi-blank" ? "multi-blank" as const : "multiple-choice" as const, responseFields: fields, topic: row.topic ?? undefined, imageUrl: row.image_url ?? undefined, choices: choicesByQuestion.get(row.id) ?? [] }];
  });
}

/** PostgREST caps a response at 1000 rows; this reads every page of a ranged query. */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error || !data) return { rows, error };
    rows.push(...data);
    if (data.length < 1000) return { rows, error: null };
  }
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}
