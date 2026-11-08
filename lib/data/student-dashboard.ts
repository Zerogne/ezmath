import "server-only";

import { getPortalData } from "@/lib/data/student-portal";
import type { HistoryAttempt } from "@/lib/data/student-history";
import { getStudentActivity, type StudentActivity } from "@/lib/data/student-activity";
import { getStudentLeaderboards, type Leaderboard } from "@/lib/data/leaderboard";
import type { StudentGoal } from "@/lib/goals";
import type { PlanCode } from "@/lib/payments/plans";
import type { Test } from "@/types/exam";

export type StudentDashboardData = {
  name: string;
  email: string;
  avatarUrl: string | null;
  planCode: PlanCode;
  planExpiresAt: string | null;
  attempts: HistoryAttempt[];
  tests: Test[];
  goal: StudentGoal | null;
  activity: StudentActivity;
  leaderboards: Leaderboard[];
};

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  const data = await getPortalData();
  const [activity, leaderboards] = await Promise.all([getStudentActivity(data.attempts), getStudentLeaderboards()]);
  return {
    name: data.profile.full_name?.trim() || data.email.split("@")[0] || "Сурагч",
    email: data.email,
    avatarUrl: data.profile.avatar_url,
    planCode: data.plan.code,
    planExpiresAt: data.plan.periodEnd,
    attempts: data.attempts,
    tests: data.tests,
    goal: data.goal,
    activity,
    leaderboards,
  };
}
