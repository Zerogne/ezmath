import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";

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

type HistoryRow = {
  attempt_id: string;
  test_id: string;
  title: string;
  exam_type: string;
  subject: string;
  score: number | string;
  duration_seconds: number | null;
  completed_at: string;
  correct: number;
  total: number;
  topics: { topic: string; correct: number; total: number }[] | null;
};

const percent = (correct: number, total: number) => total ? Math.round(correct / total * 100) : 0;

/** The student's latest 100 submitted attempts, oldest first, in one database round trip (deduplicated per request). */
export const getStudentHistory = cache(async (): Promise<HistoryAttempt[]> => {
  if (!isSupabaseConfigured()) return [];
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard/progress");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("student_attempt_history", { p_limit: 100 });
  if (error) throw new Error("Шалгалтын түүхийг ачаалж чадсангүй.");

  const previousScore = new Map<string, number>();
  return (data as HistoryRow[]).map((row) => {
    const examType = row.exam_type === "SAT" ? "SAT" : "EYESH";
    const score = Number(row.score);
    const prior = previousScore.get(examType);
    previousScore.set(examType, score);
    return {
      id: row.attempt_id,
      testId: row.test_id,
      title: row.title,
      examType,
      subject: row.subject,
      score,
      maxScore: 800,
      accuracy: percent(row.correct, row.total),
      correct: row.correct,
      total: row.total,
      durationSeconds: row.duration_seconds ?? 0,
      completedAt: row.completed_at,
      change: prior === undefined ? null : score - prior,
      topics: (row.topics ?? []).map((topic) => ({ ...topic, accuracy: percent(topic.correct, topic.total) })),
    };
  });
});
