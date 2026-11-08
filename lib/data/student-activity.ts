import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import type { HistoryAttempt } from "@/lib/data/student-history";

export type DayActivity = { day: string; problems: number; correct: number; lessons: number };
export type StudentActivity = {
  /** Consecutive active days ending today, or yesterday if today has no activity yet. */
  streak: number;
  bestStreak: number;
  /** True once today counts toward the streak. */
  activeToday: boolean;
  solvedToday: number;
  /** Monday to Sunday of the current week. */
  week: { label: string; day: string; problems: number; isToday: boolean }[];
};

const DAY_MS = 86_400_000;
const WEEKDAY_LABELS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

/** YYYY-MM-DD in Ulaanbaatar (UTC+8, no daylight saving), whatever region the server runs in. */
export function mnDay(date: Date | string = new Date()) {
  return new Date(new Date(date).getTime() + 8 * 3_600_000).toISOString().slice(0, 10);
}
const shiftDay = (day: string, by: number) => new Date(Date.parse(`${day}T00:00:00Z`) + by * DAY_MS).toISOString().slice(0, 10);

export function summarizeActivity(rows: DayActivity[], today = mnDay()): StudentActivity {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const active = (day: string) => { const row = byDay.get(day); return Boolean(row && (row.problems > 0 || row.lessons > 0)); };

  let cursor = active(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (active(cursor)) { streak += 1; cursor = shiftDay(cursor, -1); }

  let bestStreak = 0, run = 0, previous: string | null = null;
  for (const day of [...byDay.keys()].filter(active).sort()) {
    run = previous && shiftDay(previous, 1) === day ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = day;
  }

  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const monday = shiftDay(today, -weekday);
  const week = WEEKDAY_LABELS.map((label, index) => {
    const day = shiftDay(monday, index);
    return { label, day, problems: byDay.get(day)?.problems ?? 0, isToday: day === today };
  });
  return { streak, bestStreak: Math.max(bestStreak, streak), activeToday: active(today), solvedToday: byDay.get(today)?.problems ?? 0, week };
}

/** Test-history fallback for local mock mode and for databases without the activity migration. */
function activityFromAttempts(attempts: HistoryAttempt[]): DayActivity[] {
  const days = new Map<string, DayActivity>();
  for (const attempt of attempts) {
    const day = mnDay(attempt.completedAt);
    const row = days.get(day) ?? { day, problems: 0, correct: 0, lessons: 0 };
    row.problems += attempt.total;
    row.correct += attempt.correct;
    days.set(day, row);
  }
  return [...days.values()];
}

/** The student's last ~13 months of daily activity, summarized for the dashboard. */
export async function getStudentActivity(attempts: HistoryAttempt[]): Promise<StudentActivity> {
  if (!isSupabaseConfigured()) return summarizeActivity(activityFromAttempts(attempts));
  const user = await getSessionUser();
  if (!user) return summarizeActivity([]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_daily_activity")
    .select("day, problems, correct, lessons")
    .eq("user_id", user.id)
    .gte("day", shiftDay(mnDay(), -400))
    .order("day");
  if (error) return summarizeActivity(activityFromAttempts(attempts));
  return summarizeActivity(data);
}
