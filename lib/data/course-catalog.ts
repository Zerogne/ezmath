import "server-only";
import { coreMathCourse, type Course, type Lesson } from "@/lib/learning/course-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Section = Lesson["sections"][number];
export type ModuleSummary = { id: string; title: string; description: string; builtin: boolean; parentId: string | null };

function isSection(value: unknown): value is Section {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.title === "string" && typeof item.body === "string" && (item.example === undefined || typeof item.example === "string");
}

export async function listCustomModules() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("course_modules")
    .select("id,title,description,parent_id")
    .eq("course_slug", coreMathCourse.slug)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data;
}

export async function listAllModules(): Promise<ModuleSummary[]> {
  const builtin = coreMathCourse.modules.map((item) => ({ id: item.id, title: item.title, description: item.description, builtin: true as const, parentId: null }));
  const custom = (await listCustomModules()).map((item) => ({ id: item.id, title: item.title, description: item.description ?? "", builtin: false as const, parentId: item.parent_id }));
  return [...builtin, ...custom];
}

export async function getModule(moduleId: string): Promise<ModuleSummary | undefined> {
  return (await listAllModules()).find((item) => item.id === moduleId);
}

export async function getCourseCatalog(): Promise<Course> {
  if (!isSupabaseConfigured()) return coreMathCourse;
  const supabase = await createClient();
  const [{ data, error }, customModules] = await Promise.all([
    supabase.from("course_lessons")
      .select("slug,module_id,title,duration_minutes,summary,objectives,sections,sort_order")
      .eq("course_slug", coreMathCourse.slug)
      .eq("status", "published")
      .order("sort_order", { ascending: true }),
    listCustomModules(),
  ]);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return coreMathCourse;
    throw new Error(`Хичээлүүдийг уншиж чадсангүй: ${error.message}`);
  }

  const modules = [
    ...coreMathCourse.modules.map((item) => ({ ...item, lessons: [...item.lessons] })),
    ...customModules.map((item) => ({ id: item.id, title: item.title, description: item.description ?? "", lessons: [] as Lesson[] })),
  ];
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
  // Custom modules (and submodules, treated as flat peers on the public page) with no published lessons yet would render as an empty section.
  return { ...coreMathCourse, modules: modules.filter((item) => item.lessons.length) };
}

export function findCourseLesson(course: Course, lessonId: string) {
  for (const courseModule of course.modules) {
    const item = courseModule.lessons.find((candidate) => candidate.id === lessonId);
    if (item) return { ...item, moduleId: courseModule.id, moduleTitle: courseModule.title };
  }
}
