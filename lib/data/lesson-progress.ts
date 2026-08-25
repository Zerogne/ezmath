import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type LessonProgress = {
  lesson_id: string;
  completed_at: string | null;
  last_opened_at: string;
};

export async function getLessonProgress(nextPath = "/lesson") {
  if (!isSupabaseConfigured()) return { userId: null, progress: [] as LessonProgress[] };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const { data, error } = await supabase
    .from("student_lesson_progress")
    .select("lesson_id,completed_at,last_opened_at")
    .eq("user_id", user.id)
    .order("last_opened_at", { ascending: false });
  if (error) throw new Error(`Хичээлийн явцыг уншиж чадсангүй: ${error.message}`);
  return { userId: user.id, progress: data ?? [] };
}
