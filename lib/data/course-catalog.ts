import "server-only";
import { coreMathCourse, type Course, type CourseMainModule, type Lesson, type LessonInContext } from "@/lib/learning/course-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Section = Lesson["sections"][number];
// parentId === null marks a main module; otherwise it is a submodule of that main module. Lessons attach to submodules only.
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
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return [];
  return data;
}

export async function listAllModules(): Promise<ModuleSummary[]> {
  const builtin = coreMathCourse.modules.flatMap((main) => [
    { id: main.id, title: main.title, description: main.description, builtin: true, parentId: null },
    ...main.submodules.map((sub) => ({ id: sub.id, title: sub.title, description: sub.description, builtin: true, parentId: main.id })),
  ]);
  const custom = (await listCustomModules()).map((item) => ({ id: item.id, title: item.title, description: item.description ?? "", builtin: false, parentId: item.parent_id }));
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

  const mains: CourseMainModule[] = coreMathCourse.modules.map((main) => ({ ...main, submodules: main.submodules.map((sub) => ({ ...sub, lessons: [...sub.lessons] })) }));
  for (const item of customModules) if (!item.parent_id) mains.push({ id: item.id, title: item.title, description: item.description ?? "", submodules: [] });
  for (const item of customModules) {
    if (!item.parent_id) continue;
    mains.find((main) => main.id === item.parent_id)?.submodules.push({ id: item.id, title: item.title, description: item.description ?? "", lessons: [] });
  }

  const submodules = new Map(mains.flatMap((main) => main.submodules.map((sub) => [sub.id, sub] as const)));
  for (const row of data ?? []) {
    const target = submodules.get(row.module_id);
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
  // Hide empty branches so students never land on a module with nothing to open.
  const modules = mains
    .map((main) => ({ ...main, submodules: main.submodules.filter((sub) => sub.lessons.length) }))
    .filter((main) => main.submodules.length);
  return { ...coreMathCourse, modules };
}

export function findCourseLesson(course: Course, lessonId: string): LessonInContext | undefined {
  for (const main of course.modules) {
    for (const sub of main.submodules) {
      const item = sub.lessons.find((candidate) => candidate.id === lessonId);
      if (item) return { ...item, moduleId: main.id, moduleTitle: main.title, submoduleId: sub.id, submoduleTitle: sub.title };
    }
  }
}
