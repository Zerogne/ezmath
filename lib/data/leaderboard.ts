import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LeaderboardRow = { studentId: string; name: string; avatarUrl: string | null; problems: number; correct: number; streak: number; rank: number; isMe: boolean };
export type Leaderboard = { key: string; title: string; scope: "class" | "school"; rows: LeaderboardRow[] };

/**
 * This week's ranking for one class or for the caller's school. The database function checks access
 * (class member or the class's teacher; same school), so an empty list also covers "not allowed".
 * Returns [] when the activity migration has not been applied yet.
 */
export async function loadLeaderboard(scope: "class" | "school", classroomId?: string): Promise<LeaderboardRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("weekly_leaderboard", { p_scope: scope, p_classroom_id: classroomId ?? null });
  if (error) { if (error.code !== "PGRST202") console.error("Leaderboard load failed", { scope, code: error.code }); return []; }
  type Row = { student_id: string; full_name: string; avatar_url: string | null; problems: number; correct: number; streak: number; rank: number; is_me: boolean };
  return (data as Row[]).map((row) => ({ studentId: row.student_id, name: row.full_name, avatarUrl: row.avatar_url, problems: row.problems, correct: row.correct, streak: row.streak, rank: row.rank, isMe: row.is_me }));
}

/** This week's ranking for each class the student has joined. Students never see a school-wide ranking. */
export async function getStudentClassLeaderboards(classes: { id: string; name: string }[]): Promise<Leaderboard[]> {
  if (!isSupabaseConfigured() || !classes.length) return [];
  const boards = await Promise.all(classes.map(async (item) => ({ key: item.id, title: item.name, scope: "class" as const, rows: await loadLeaderboard("class", item.id) })));
  return boards.filter((board) => board.rows.length > 0);
}
