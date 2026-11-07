"use server";

import { after } from "next/server";
import { generateAttemptAnalysis, readAttemptAnalysis, type AnalysisState } from "@/lib/ai/attempt-analysis";
import { generateStudyPlan, readStudyPlan, type PlanState } from "@/lib/ai/study-plan";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function currentUserId() {
  if (!isSupabaseConfigured()) return null;
  const { data: { user } } = await (await createClient()).auth.getUser();
  return user?.id ?? null;
}

/**
 * Polled by the result page. Starts generation when none exists yet (or, with `retry`, after a failure);
 * the generator itself skips work that is ready or already running.
 */
export async function getAttemptAnalysis(attemptId: string, options: { retry?: boolean } = {}): Promise<AnalysisState> {
  const userId = await currentUserId();
  if (!userId || !/^[0-9a-f-]{36}$/i.test(attemptId)) return { status: "unavailable" };
  const state = await readAttemptAnalysis(userId, attemptId);
  if (state.status === "pending" || (state.status === "failed" && options.retry)) {
    after(() => generateAttemptAnalysis(userId, attemptId));
    return { status: "pending" };
  }
  return state;
}

/** Polled by the dashboard card; generates this week's plan on the first visit of the week. */
export async function getStudyPlan(options: { retry?: boolean } = {}): Promise<PlanState> {
  const userId = await currentUserId();
  if (!userId) return { status: "unavailable" };
  const state = await readStudyPlan(userId);
  if (state.status === "pending" || (state.status === "failed" && options.retry)) {
    after(() => generateStudyPlan(userId));
    return { status: "pending" };
  }
  return state;
}
