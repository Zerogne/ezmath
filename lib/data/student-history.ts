import "server-only";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type HistoryAttempt = {
  id: string;
  testId: string;
  title: string;
  examType: "SAT" | "EYESH";
  subject: string;
  score: number;
  maxScore: number;
  accuracy: number;
  correct: number;
  total: number;
  durationSeconds: number;
  completedAt: string;
  change: number | null;
  topics: { topic: string; correct: number; total: number; accuracy: number }[];
};

export async function getStudentHistory(): Promise<HistoryAttempt[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/progress");

  const { data: attempts, error } = await supabase
    .from("test_attempts")
    .select("id, test_id, score, duration_seconds, completed_at")
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .not("completed_at", "is", null)
    .not("score", "is", null)
    .order("completed_at", { ascending: true })
    .limit(100);

  if (error) throw new Error("Шалгалтын түүхийг ачаалж чадсангүй.");
  if (!attempts.length) return [];

  const attemptIds = attempts.map((attempt) => attempt.id);
  const testIds = [...new Set(attempts.map((attempt) => attempt.test_id))];
  const [{ data: tests, error: testsError }, { data: answers, error: answersError }] = await Promise.all([
    supabase.from("tests").select("id, title, exam_type, subject").in("id", testIds),
    supabase.from("attempt_answers").select("attempt_id, question_id, is_correct").in("attempt_id", attemptIds),
  ]);

  if (testsError || answersError) throw new Error("Шалгалтын үр дүнг ачаалж чадсангүй.");

  const questionIds = [...new Set((answers ?? []).map((answer) => answer.question_id))];
  const { data: questions, error: questionsError } = questionIds.length
    ? await supabase.from("student_questions").select("id, topic").in("id", questionIds)
    : { data: [], error: null };
  if (questionsError) throw new Error("Сэдвийн үр дүнг ачаалж чадсангүй.");

  const testsById = new Map((tests ?? []).map((test) => [test.id, test]));
  const topicByQuestion = new Map((questions ?? []).map((question) => [question.id, question.topic?.trim() || "Бусад"]));
  const totals = new Map<string, { correct: number; total: number }>();
  const topics = new Map<string, Map<string, { correct: number; total: number }>>();
  for (const answer of answers ?? []) {
    const value = totals.get(answer.attempt_id) ?? { correct: 0, total: 0 };
    value.total += 1;
    if (answer.is_correct) value.correct += 1;
    totals.set(answer.attempt_id, value);
    const topic = topicByQuestion.get(answer.question_id) ?? "Бусад";
    const attemptTopics = topics.get(answer.attempt_id) ?? new Map<string, { correct: number; total: number }>();
    const topicValue = attemptTopics.get(topic) ?? { correct: 0, total: 0 };
    topicValue.total += 1;
    if (answer.is_correct) topicValue.correct += 1;
    attemptTopics.set(topic, topicValue);
    topics.set(answer.attempt_id, attemptTopics);
  }

  const previousScore = new Map<"SAT" | "EYESH", number>();
  return attempts.flatMap((attempt) => {
    const test = testsById.get(attempt.test_id);
    if (!test || attempt.score === null || !attempt.completed_at) return [];
    const score = Number(attempt.score);
    const answerTotal = totals.get(attempt.id) ?? { correct: 0, total: 0 };
    const prior = previousScore.get(test.exam_type);
    previousScore.set(test.exam_type, score);
    return [{
      id: attempt.id,
      testId: attempt.test_id,
      title: test.title,
      examType: test.exam_type,
      subject: test.subject,
      score,
      maxScore: test.exam_type === "SAT" ? 800 : 100,
      accuracy: answerTotal.total ? Math.round(answerTotal.correct / answerTotal.total * 100) : 0,
      correct: answerTotal.correct,
      total: answerTotal.total,
      durationSeconds: attempt.duration_seconds ?? 0,
      completedAt: attempt.completed_at,
      change: prior === undefined ? null : score - prior,
      topics: [...(topics.get(attempt.id) ?? new Map()).entries()].map(([topic, value]) => ({
        topic,
        ...value,
        accuracy: value.total ? Math.round(value.correct / value.total * 100) : 0,
      })),
    }];
  });
}
