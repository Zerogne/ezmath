"use server";

import { getQuestions, getTest } from "@/lib/data/mock-tests";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SubmissionPayload, SubmissionResult } from "@/lib/exam/test-types";

export async function submitTestAttempt(payload: SubmissionPayload): Promise<SubmissionResult> {
  const test = getTest(payload.testId);
  const questions = getQuestions(payload.testId);
  if ((!test || !questions.length) && isSupabaseConfigured()) return submitDatabaseAttempt(payload);
  if (!test || !questions.length) throw new Error("Шалгалт олдсонгүй.");
  const submitted = new Map(payload.answers.map((answer) => [answer.questionId, answer.selectedChoiceId]));
  const answerResults: SubmissionResult["answerResults"] = {};
  const topics = new Map<string, { correct: number; total: number }>();
  let correct = 0;
  let incorrect = 0;
  for (const question of questions) {
    const selected = submitted.get(question.id);
    const validChoice = selected && question.choices.some((choice) => choice.id === selected);
    const state = !validChoice ? "unanswered" : selected === question.correctAnswer ? "correct" : "incorrect";
    answerResults[question.id] = state;
    if (state === "correct") correct += 1;
    if (state === "incorrect") incorrect += 1;
    const topic = question.topic ?? "Бусад";
    const current = topics.get(topic) ?? { correct: 0, total: 0 };
    topics.set(topic, { correct: current.correct + (state === "correct" ? 1 : 0), total: current.total + 1 });
  }
  const accuracy = Math.round((correct / questions.length) * 100);
  return {
    score: test.examType === "SAT" ? Math.round((400 + accuracy * 4) / 10) * 10 : accuracy,
    maxScore: test.examType === "SAT" ? 800 : 100,
    correct,
    incorrect,
    unanswered: questions.length - correct - incorrect,
    accuracy,
    durationSeconds: Math.max(0, Math.min(payload.durationSeconds, test.durationMinutes * 60)),
    answerResults,
    topicBreakdown: Array.from(topics, ([topic, value]) => ({ topic, ...value, accuracy: Math.round(value.correct / value.total * 100) })),
  };
}

async function submitDatabaseAttempt(payload: SubmissionPayload): Promise<SubmissionResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Submission service is not configured.");
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error("Шалгалтаа илгээхийн тулд нэвтэрнэ үү.");
  const admin = createAdminClient();
  const [{ data: test }, { data: questions }] = await Promise.all([
    admin.from("tests").select("id, exam_type, duration_minutes").eq("id", payload.testId).eq("status", "published").single(),
    admin.from("questions").select("id, topic").eq("test_id", payload.testId).order("question_number"),
  ]);
  if (!test || !questions?.length) throw new Error("Шалгалт олдсонгүй.");
  const { data: choices } = await admin.from("answer_choices").select("id, question_id, is_correct").in("question_id", questions.map((question) => question.id));
  const selected = new Map(payload.answers.map((answer) => [answer.questionId, answer.selectedChoiceId]));
  const choiceMap = new Map((choices ?? []).map((choice) => [choice.id, choice]));
  const answerResults: SubmissionResult["answerResults"] = {};
  const topics = new Map<string, { correct: number; total: number }>();
  let correct = 0;
  let incorrect = 0;
  for (const question of questions) {
    const choice = choiceMap.get(selected.get(question.id) ?? "");
    const state = !choice || choice.question_id !== question.id ? "unanswered" : choice.is_correct ? "correct" : "incorrect";
    answerResults[question.id] = state;
    if (state === "correct") correct += 1;
    if (state === "incorrect") incorrect += 1;
    const topic = question.topic ?? "Бусад";
    const current = topics.get(topic) ?? { correct: 0, total: 0 };
    topics.set(topic, { correct: current.correct + (state === "correct" ? 1 : 0), total: current.total + 1 });
  }
  const accuracy = Math.round(correct / questions.length * 100);
  const durationSeconds = Math.max(0, Math.min(payload.durationSeconds, test.duration_minutes * 60));
  let attemptId = payload.attemptId;
  if (attemptId) {
    const { data: existing } = await admin.from("test_attempts").select("id").eq("id", attemptId).eq("user_id", user.id).eq("status", "in_progress").maybeSingle();
    if (!existing) throw new Error("Оролдлого хүчингүй байна.");
  } else {
    const { data: created, error } = await admin.from("test_attempts").insert({ user_id: user.id, test_id: payload.testId, started_at: payload.startedAt, status: "in_progress" }).select("id").single();
    if (error || !created) throw new Error("Оролдлого үүсгэж чадсангүй.");
    attemptId = created.id;
  }
  const answerRows = questions.map((question) => { const choiceId = selected.get(question.id); const choice = choiceMap.get(choiceId ?? ""); const validChoice = choice && choice.question_id === question.id ? choice : null; return { attempt_id: attemptId!, question_id: question.id, selected_choice_id: validChoice?.id ?? null, is_correct: validChoice?.is_correct ?? null, time_spent_seconds: null, marked_for_review: payload.markedForReview.includes(question.id) }; });
  const { error: answersError } = await admin.from("attempt_answers").upsert(answerRows, { onConflict: "attempt_id,question_id" });
  if (answersError) throw new Error("Хариултуудыг хадгалж чадсангүй.");
  const score = test.exam_type === "SAT" ? Math.round((400 + accuracy * 4) / 10) * 10 : accuracy;
  const { error: completeError } = await admin.from("test_attempts").update({ status: "submitted", completed_at: new Date().toISOString(), score, duration_seconds: durationSeconds }).eq("id", attemptId).eq("user_id", user.id);
  if (completeError) throw new Error("Шалгалтыг дуусгаж чадсангүй.");
  return { score, maxScore: test.exam_type === "SAT" ? 800 : 100, correct, incorrect, unanswered: questions.length - correct - incorrect, accuracy, durationSeconds, answerResults, topicBreakdown: Array.from(topics, ([topic, value]) => ({ topic, ...value, accuracy: Math.round(value.correct / value.total * 100) })) };
}
