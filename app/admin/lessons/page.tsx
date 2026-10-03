import { ModulesManager } from "@/components/admin/lessons/modules-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { listAllModules } from "@/lib/data/course-catalog";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminLessonsPage() {
  const [lessons, modules] = await Promise.all([
    isSupabaseConfigured() ? (await (await createClient()).from("course_lessons").select("module_id")).data : [],
    listAllModules(),
  ]);
  const lessonCounts: Record<string, number> = {};
  for (const lesson of lessons ?? []) lessonCounts[lesson.module_id] = (lessonCounts[lesson.module_id] ?? 0) + 1;
  const topLevelModules = modules.filter((item) => !item.parentId);

  return <div className="mx-auto max-w-[1280px] space-y-7">
    <AdminPageHeader title="Онолын сэдвүүд" description="Модуль үүсгэж, дотор нь дэд модуль болон сэдэв нэмнэ."/>
    <ModulesManager title="Модулиуд" modules={topLevelModules} lessonCounts={lessonCounts} emptyLabel="Одоогоор модуль нэмээгүй байна."/>
  </div>;
}
