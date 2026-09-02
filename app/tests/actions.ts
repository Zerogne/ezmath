"use server";

import { getQuestions, getTest } from "@/lib/data/mock-tests";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SubmissionPayload, SubmissionResult } from "@/lib/exam/test-types";

export async function startTestAttempt(testId: string, startedAt: string) {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) throw new Error("Шалгалтаа эхлүүлэхийн тулд нэвтэрнэ үү.");
  const admin = createAdminClient();
  const { data: test } = await admin.from("tests").select("id,test_type").eq("id", testId).eq("status", "published").maybeSingle();
  if (!test) return null;
  const { data: existing } = await admin.from("test_attempts").select("id").eq("user_id", user.id).eq("test_id", testId).eq("status", "in_progress").order("started_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) return existing.id;
  if (test.test_type !== "practice") {
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      admin.from("student_subscriptions").select("current_period_end").eq("user_id", user.id).in("status", ["trialing", "active"]).order("provider_updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const paid = subscription && (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date());
    if (profile?.role !== "admin" && !paid) {
      const { data: completed } = await admin.from("test_attempts").select("test_id").eq("user_id", user.id).eq("status", "submitted");
      const completedIds = [...new Set((completed ?? []).map((attempt) => attempt.test_id))];
      if (completedIds.length) {
        const { count } = await admin.from("tests").select("id", { count: "exact", head: true }).in("id", completedIds).neq("test_type", "practice");
        if ((count ?? 0) >= 1) throw new Error("Үнэгүй эрхийн 1 бүтэн шалгалтын лимит дууссан. Багцаа ахиулна уу.");
      }
    }
  }
  const { data, error } = await admin.from("test_attempts").insert({ user_id: user.id, test_id: testId, started_at: startedAt, status: "in_progress" }).select("id").single();
  if (error || !data) throw new Error("Оролдлого үүсгэж чадсангүй.");
  return data.id;
}

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
    admin.from("tests").select("id, exam_type, duration_minutes, test_type").eq("id", payload.testId).eq("status", "published").single(),
    admin.from("questions").select("id, topic, question_type, response_fields").eq("test_id", payload.testId).order("question_number"),
  ]);
  if (!test || !questions?.length) throw new Error("Шалгалт олдсонгүй.");
  const questionIds = questions.map((question) => question.id);
  const [{ data: choices }, { data: responseAnswers }] = await Promise.all([
    admin.from("answer_choices").select("id, question_id, is_correct").in("question_id", questionIds),
    admin.from("question_response_answers").select("question_id,field_id,accepted_answers").in("question_id", questionIds),
  ]);
  const selected = new Map(payload.answers.map((answer) => [answer.questionId, answer.selectedChoiceId]));
  const written = new Map(payload.writtenAnswers.map((answer) => [answer.questionId, answer.responses]));
  const choiceMap = new Map((choices ?? []).map((choice) => [choice.id, choice]));
  const acceptedByField = new Map<string, string[]>((responseAnswers ?? []).map((answer) => [`${answer.question_id}:${answer.field_id}`, answer.accepted_answers]));
  const normalize = (value: string) => value.trim().toLocaleLowerCase("mn").replace(/,/g, ".").replace(/\s+/g, " ");
  const answerResults: SubmissionResult["answerResults"] = {};
  const topics = new Map<string, { correct: number; total: number }>();
  let correct = 0;
  let incorrect = 0;
  for (const question of questions) {
    let state: "correct" | "incorrect" | "unanswered";
    if (question.question_type === "multi-blank") {
      const fields = Array.isArray(question.response_fields) ? question.response_fields as { id?: string }[] : [];
      const responses = written.get(question.id) ?? {};
      const hasResponse = fields.some((field) => field.id && normalize(responses[field.id] ?? ""));
      const allCorrect = fields.length > 0 && fields.every((field) => {
        if (!field.id) return false;
        const value = normalize(responses[field.id] ?? "");
        return value.length > 0 && (acceptedByField.get(`${question.id}:${field.id}`) ?? []).some((answer) => normalize(answer) === value);
      });
      state = !hasResponse ? "unanswered" : allCorrect ? "correct" : "incorrect";
    } else {
      const choice = choiceMap.get(selected.get(question.id) ?? "");
      state = !choice || choice.question_id !== question.id ? "unanswered" : choice.is_correct ? "correct" : "incorrect";
    }
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
  const answerRows = questions.map((question) => { const choiceId = selected.get(question.id); const choice = choiceMap.get(choiceId ?? ""); const validChoice = choice && choice.question_id === question.id ? choice : null; const result = answerResults[question.id]; return { attempt_id: attemptId!, question_id: question.id, selected_choice_id: question.question_type === "multi-blank" ? null : validChoice?.id ?? null, written_response: question.question_type === "multi-blank" ? written.get(question.id) ?? {} : null, is_correct: result === "unanswered" ? null : result === "correct", time_spent_seconds: null, marked_for_review: payload.markedForReview.includes(question.id) }; });
  const { error: answersError } = await admin.from("attempt_answers").upsert(answerRows, { onConflict: "attempt_id,question_id" });
  if (answersError) { console.error("Attempt answer save failed", { attemptId, testId: payload.testId, error: answersError }); throw new Error("Хариултуудыг хадгалж чадсангүй."); }
  const score = test.exam_type === "SAT" ? Math.round((400 + accuracy * 4) / 10) * 10 : accuracy;
  const { error: completeError } = await admin.from("test_attempts").update({ status: "submitted", completed_at: new Date().toISOString(), score, duration_seconds: durationSeconds }).eq("id", attemptId).eq("user_id", user.id);
  if (completeError) { console.error("Attempt completion failed", { attemptId, testId: payload.testId, error: completeError }); throw new Error("Шалгалтыг дуусгаж чадсангүй."); }
  return { score, maxScore: test.exam_type === "SAT" ? 800 : 100, correct, incorrect, unanswered: questions.length - correct - incorrect, accuracy, durationSeconds, answerResults, topicBreakdown: Array.from(topics, ([topic, value]) => ({ topic, ...value, accuracy: Math.round(value.correct / value.total * 100) })) };
}
