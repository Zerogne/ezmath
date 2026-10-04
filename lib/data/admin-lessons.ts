import "server-only";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { listAllModules, type ModuleSummary } from "./course-catalog";

// builtin rows are the hardcoded lessons from lib/learning/course-catalog.ts: listed for context, never editable.
export type AdminLessonRow = { id: string; title: string; moduleId: string; status: "draft" | "published"; durationMinutes: number; slug: string; builtin: boolean };
export type AdminSubmodule = ModuleSummary & { lessons: AdminLessonRow[] };
export type AdminMainModule = ModuleSummary & { submodules: AdminSubmodule[]; orphanLessons: AdminLessonRow[] };

async function listLessonRows() {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("course_lessons")
    .select("id,title,module_id,status,duration_minutes,slug")
    .eq("course_slug", coreMathCourse.slug)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function getAdminLessonTree(): Promise<AdminMainModule[]> {
  const [modules, rows] = await Promise.all([listAllModules(), listLessonRows()]);
  const builtinLessons: AdminLessonRow[] = coreMathCourse.modules.flatMap((main) => main.submodules.flatMap((sub) => sub.lessons.map((item) => ({
    id: item.id, title: item.title, moduleId: sub.id, status: "published" as const, durationMinutes: Number.parseInt(item.duration, 10) || 0, slug: item.id, builtin: true,
  }))));
  const lessons: AdminLessonRow[] = [
    ...builtinLessons,
    ...rows.map((row) => ({ id: row.id, title: row.title, moduleId: row.module_id, status: row.status === "published" ? "published" as const : "draft" as const, durationMinutes: row.duration_minutes, slug: row.slug, builtin: false })),
  ];
  const lessonsOf = (moduleId: string) => lessons.filter((item) => item.moduleId === moduleId);
  return modules.filter((item) => !item.parentId).map((main) => ({
    ...main,
    submodules: modules.filter((item) => item.parentId === main.id).map((sub) => ({ ...sub, lessons: lessonsOf(sub.id) })),
    // Lessons saved directly on a main module before submodules were required; surfaced so admins can move them.
    orphanLessons: lessonsOf(main.id),
  }));
}

export function findInTree(tree: AdminMainModule[], moduleId: string) {
  for (const main of tree) {
    if (main.id === moduleId) return { main, sub: undefined };
    const sub = main.submodules.find((item) => item.id === moduleId);
    if (sub) return { main, sub };
  }
}

export function toModuleGroups(modules: ModuleSummary[]) {
  return modules.filter((item) => !item.parentId).map((main) => ({
    id: main.id,
    title: main.title,
    submodules: modules.filter((item) => item.parentId === main.id).map((sub) => ({ id: sub.id, title: sub.title })),
  }));
}

/** Breadcrumb trail (main module, then submodule if any) for a module id. */
export function moduleTrail(modules: ModuleSummary[], moduleId: string) {
  const current = modules.find((item) => item.id === moduleId);
  if (!current) return [];
  const parent = current.parentId ? modules.find((item) => item.id === current.parentId) : undefined;
  return parent ? [parent, current] : [current];
}
