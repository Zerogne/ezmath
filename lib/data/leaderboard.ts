import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";

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

/** Every board a student belongs to: their school first, then each joined class. */
export async function getStudentLeaderboards(): Promise<Leaderboard[]> {
  if (!isSupabaseConfigured()) return [];
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("school_id").eq("id", user.id).maybeSingle(),
    supabase.from("classroom_students").select("classroom_id, joined_at").eq("student_id", user.id).order("joined_at"),
  ]);
  const classIds = (memberships ?? []).map((row) => row.classroom_id);
  const [{ data: classes }, { data: school }] = await Promise.all([
    classIds.length ? supabase.from("classrooms").select("id, name").in("id", classIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    profile?.school_id ? supabase.from("schools").select("name").eq("id", profile.school_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const classNames = new Map((classes ?? []).map((row) => [row.id, row.name]));
  const boards: Promise<Leaderboard>[] = [];
  if (profile?.school_id) boards.push(loadLeaderboard("school").then((rows) => ({ key: "school", title: school?.name || "Манай сургууль", scope: "school", rows })));
  for (const id of classIds) boards.push(loadLeaderboard("class", id).then((rows) => ({ key: id, title: classNames.get(id) || "Миний анги", scope: "class", rows })));
  return (await Promise.all(boards)).filter((board) => board.rows.length > 0);
}
