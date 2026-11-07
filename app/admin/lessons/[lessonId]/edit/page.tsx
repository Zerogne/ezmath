import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LessonBreadcrumbs } from "@/components/admin/lessons/breadcrumbs";
import { LessonForm, type LessonEditorData } from "@/components/admin/lessons/lesson-form";
import { listAllModules, practiceFromRow } from "@/lib/data/course-catalog";
import { moduleTrail, toModuleGroups } from "@/lib/data/admin-lessons";
import { createClient } from "@/lib/supabase/server";

export default async function EditLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const [{ data }, modules] = await Promise.all([
    supabase.from("course_lessons").select("id,title,slug,module_id,summary,duration_minutes,sort_order,status,objectives,sections,example,test_problem,test_answer").eq("id", lessonId).maybeSingle(),
    listAllModules(),
  ]);
  if (!data) notFound();
  const initial: LessonEditorData = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    moduleId: data.module_id,
    summary: data.summary,
    durationMinutes: data.duration_minutes,
    sortOrder: data.sort_order,
    status: data.status === "published" ? "published" : "draft",
    objectives: data.objectives ?? [],
    sections: Array.isArray(data.sections) ? data.sections as LessonEditorData["sections"] : [],
    practice: practiceFromRow(data),
  };
  const trail = moduleTrail(modules, data.module_id);
  return <div className="mx-auto max-w-[1280px]">
    <LessonBreadcrumbs items={[{ label: "Модулиуд", href: "/admin/lessons" }, ...trail.map((item) => ({ label: item.title, href: `/admin/lessons/module/${item.id}` })), { label: data.title }]}/>
    <AdminPageHeader title="Сэдэв засах" description={data.title}/>
    <LessonForm initial={initial} moduleGroups={toModuleGroups(modules)}/>
  </div>;
}
