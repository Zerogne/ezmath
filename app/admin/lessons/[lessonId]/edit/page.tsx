import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LessonForm, type LessonEditorData } from "@/components/admin/lessons/lesson-form";
import { listAllModules } from "@/lib/data/course-catalog";
import { createClient } from "@/lib/supabase/server";

export default async function EditLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const [{ data }, modules] = await Promise.all([
    supabase.from("course_lessons").select("id,title,slug,module_id,summary,duration_minutes,sort_order,status,objectives,sections").eq("id", lessonId).maybeSingle(),
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
  };
  const parentModule = modules.find((item) => item.id === data.module_id);
  return <div className="mx-auto max-w-[1280px]">
    {parentModule && <Link href={`/admin/lessons/module/${parentModule.id}`} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>{parentModule.title}</Link>}
    <AdminPageHeader title="Сэдэв засах" description={data.title}/>
    <LessonForm initial={initial} modules={modules}/>
  </div>;
}
