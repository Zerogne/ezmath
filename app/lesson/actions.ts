"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { allLessons } from "@/lib/learning/course-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function updateLessonProgress(lessonId: string, completed: boolean) {
  if (!allLessons.some((item) => item.id === lessonId)) throw new Error("Хичээл олдсонгүй.");
  if (!isSupabaseConfigured()) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/lesson/theory-core/${lessonId}`)}`);

  const now = new Date().toISOString();
  const { error } = await supabase.from("student_lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      last_opened_at: now,
      completed_at: completed ? now : null,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw new Error(`Явцыг хадгалж чадсангүй: ${error.message}`);
  revalidatePath("/lesson");
  revalidatePath("/lesson/theory-core");
  revalidatePath(`/lesson/theory-core/${lessonId}`);
}
