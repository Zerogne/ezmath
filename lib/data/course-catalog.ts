import "server-only";
import { coreMathCourse, type Course, type Lesson } from "@/lib/learning/course-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Section = Lesson["sections"][number];

function isSection(value: unknown): value is Section {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.title === "string" && typeof item.body === "string" && (item.example === undefined || typeof item.example === "string");
}

export async function getCourseCatalog(): Promise<Course> {
  if (!isSupabaseConfigured()) return coreMathCourse;
  const supabase = await createClient();
  const { data, error } = await supabase.from("course_lessons")
    .select("slug,module_id,title,duration_minutes,summary,objectives,sections,sort_order")
    .eq("course_slug", coreMathCourse.slug)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return coreMathCourse;
    throw new Error(`Хичээлүүдийг уншиж чадсангүй: ${error.message}`);
  }

  const modules = coreMathCourse.modules.map((item) => ({ ...item, lessons: [...item.lessons] }));
  for (const row of data ?? []) {
    const target = modules.find((item) => item.id === row.module_id);
    const sections = Array.isArray(row.sections) ? row.sections.filter(isSection) : [];
    if (!target || !sections.length) continue;
    target.lessons.push({
      id: row.slug,
      title: row.title,
      duration: `${row.duration_minutes} мин`,
      summary: row.summary,
      objectives: row.objectives,
      sections,
    });
  }
  return { ...coreMathCourse, modules };
}

export function findCourseLesson(course: Course, lessonId: string) {
  for (const courseModule of course.modules) {
    const item = courseModule.lessons.find((candidate) => candidate.id === lessonId);
    if (item) return { ...item, moduleId: courseModule.id, moduleTitle: courseModule.title };
  }
}
