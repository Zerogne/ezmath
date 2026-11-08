"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isMissingTable } from "@/lib/data/question-bank";
import { gradeWritten } from "@/lib/exam/grade-question";
import { FREE_DAILY_EXERCISES, hasPaidAccess } from "@/lib/payments/entitlement";
import { startOfUlaanbaatarDay } from "@/lib/ulaanbaatar-time";

export type BankCheckResult =
  | { error: string }
  | { state: "correct" | "incorrect"; correctChoiceId: string | null; acceptedAnswers: { label: string; answers: string[] }[]; explanation: string };

async function currentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Loads a question only if it belongs to a published SAT test. */
async function loadBankQuestion(questionId: string) {
  const admin = createAdminClient();
  const { data: question } = await admin.from("questions").select("id, test_id, question_type, response_fields, explanation").eq("id", questionId).maybeSingle();
  if (!question) return null;
  const { data: test } = await admin.from("tests").select("id").eq("id", question.test_id).eq("exam_type", "SAT").eq("status", "published").maybeSingle();
  return test ? question : null;
}

/** Grades one question-bank answer, records it in the student's progress and returns the solution. */
export async function checkBankAnswer(input: { questionId: string; selectedChoiceId?: string; responses?: Record<string, string> }): Promise<BankCheckResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Дахин нэвтэрнэ үү." };
  const question = await loadBankQuestion(input.questionId);
  if (!question) return { error: "Асуулт олдсонгүй." };
  if (!await withinFreeDailyLimit(userId, question.id)) return { error: `Багцгүй эрхээр өдөрт ${FREE_DAILY_EXERCISES} бодлого бодно. Маргааш дахин үргэлжлүүлэх эсвэл багц сонгоно уу.` };
  const admin = createAdminClient();
  const [{ data: choices }, { data: accepted }] = await Promise.all([
    admin.from("answer_choices").select("id, is_correct").eq("question_id", question.id),
    admin.from("question_response_answers").select("field_id, accepted_answers").eq("question_id", question.id),
  ]);
  const written = question.question_type === "multi-blank";
  const fields = Array.isArray(question.response_fields) ? question.response_fields as { id?: string; label?: string }[] : [];
  const acceptedFor = (fieldId: string) => accepted?.find((row) => row.field_id === fieldId)?.accepted_answers ?? [];
  const correctChoice = choices?.find((choice) => choice.is_correct) ?? null;
  const state = written
    ? gradeWritten(fields, input.responses ?? {}, acceptedFor, true)
    : !input.selectedChoiceId || !choices?.some((choice) => choice.id === input.selectedChoiceId) ? "unanswered" : input.selectedChoiceId === correctChoice?.id ? "correct" : "incorrect";
  if (state === "unanswered") return { error: written ? "Хариултаа бичнэ үү." : "Хариултаа сонгоно уу." };
  await recordAnswer(userId, question.id, state === "correct");
  return {
    state,
    correctChoiceId: written ? null : correctChoice?.id ?? null,
    acceptedAnswers: written ? fields.flatMap((field) => field.id ? [{ label: field.label || "Хариулт", answers: acceptedFor(field.id) }] : []) : [],
    explanation: question.explanation ?? "",
  };
}

/** Marks or unmarks a question for review. Returns false when progress can't be stored. */
export async function setBankMark(questionId: string, marked: boolean) {
  const userId = await currentUserId();
  if (!userId || !await loadBankQuestion(questionId)) return false;
  const { error } = await createAdminClient().from("question_bank_progress").upsert({ user_id: userId, question_id: questionId, marked, updated_at: new Date().toISOString() }, { onConflict: "user_id,question_id" });
  if (error && !isMissingTable(error)) console.error("Question bank mark failed", error);
  return !error;
}

/** Free students may answer FREE_DAILY_EXERCISES distinct questions per day; re-checking one of today's questions is free. */
async function withinFreeDailyLimit(userId: string, questionId: string) {
  if (await hasPaidAccess(userId)) return true;
  const since = startOfUlaanbaatarDay();
  const { data, error } = await createAdminClient().from("question_bank_progress").select("question_id").eq("user_id", userId).gte("last_answered_at", since);
  if (error) return true;
  return data.some((row) => row.question_id === questionId) || data.length < FREE_DAILY_EXERCISES;
}

async function recordAnswer(userId: string, questionId: string, correct: boolean) {
  const admin = createAdminClient();
  const { data: current, error: readError } = await admin.from("question_bank_progress").select("attempts, correct_count").eq("user_id", userId).eq("question_id", questionId).maybeSingle();
  if (readError) { if (!isMissingTable(readError)) console.error("Question bank progress read failed", readError); return; }
  const now = new Date().toISOString();
  const { error } = await admin.from("question_bank_progress").upsert({ user_id: userId, question_id: questionId, attempts: (current?.attempts ?? 0) + 1, correct_count: (current?.correct_count ?? 0) + (correct ? 1 : 0), last_correct: correct, last_answered_at: now, updated_at: now }, { onConflict: "user_id,question_id" });
  if (error) console.error("Question bank progress write failed", error);
}
