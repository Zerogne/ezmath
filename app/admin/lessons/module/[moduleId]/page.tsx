import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ModulesManager } from "@/components/admin/lessons/modules-manager";
import { LessonsTable } from "@/components/admin/lessons/lessons-table";
import { Button } from "@/components/ui/shadcn/button";
import { getModule, listAllModules } from "@/lib/data/course-catalog";
import { createClient } from "@/lib/supabase/server";

export default async function AdminModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const supabase = await createClient();
  const [currentModule, modules, { data: lessons }] = await Promise.all([
    getModule(moduleId),
    listAllModules(),
    supabase.from("course_lessons").select("id,title,module_id,status,duration_minutes,slug").eq("module_id", moduleId).order("sort_order", { ascending: true }),
  ]);
  if (!currentModule) notFound();

  const children = modules.filter((item) => item.parentId === moduleId);
  const childLessonCounts: Record<string, number> = {};
  for (const child of children) {
    const { count } = await supabase.from("course_lessons").select("id", { count: "exact", head: true }).eq("module_id", child.id);
    childLessonCounts[child.id] = count ?? 0;
  }

  return <div className="mx-auto max-w-[1280px] space-y-7">
    <Link href="/admin/lessons" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Модулиуд</Link>
    <AdminPageHeader title={currentModule.title} description={currentModule.description || "Дэд модуль болон сэдэв нэмнэ."} action={<Button asChild><Link href={`/admin/lessons/new?moduleId=${currentModule.id}`}><Plus size={16}/>Сэдэв нэмэх</Link></Button>}/>
    <ModulesManager title="Дэд модулиуд" modules={children} lessonCounts={childLessonCounts} parentId={currentModule.id} emptyLabel="Дэд модуль алга байна."/>
    <div>
      <h2 className="mb-4 font-bold">Сэдвүүд</h2>
      <LessonsTable lessons={lessons ?? []} moduleTitles={{ [currentModule.id]: currentModule.title }}/>
    </div>
  </div>;
}
