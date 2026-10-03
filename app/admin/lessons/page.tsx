import { Plus } from "lucide-react";
import Link from "next/link";
import { LessonsTable } from "@/components/admin/lessons/lessons-table";
import { ModulesManager } from "@/components/admin/lessons/modules-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/shadcn/button";
import { listAllModules } from "@/lib/data/course-catalog";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminLessonsPage() {
  const [data, modules] = await Promise.all([
    isSupabaseConfigured() ? (await (await createClient()).from("course_lessons").select("id,title,module_id,status,duration_minutes,slug").order("created_at", { ascending: false }).limit(100)).data : [],
    listAllModules(),
  ]);
  const lessons = data ?? [];
  const lessonCounts: Record<string, number> = {};
  for (const lesson of lessons) lessonCounts[lesson.module_id] = (lessonCounts[lesson.module_id] ?? 0) + 1;
  const moduleTitles = Object.fromEntries(modules.map((item) => [item.id, item.title]));

  return <div className="mx-auto max-w-[1280px] space-y-7">
    <AdminPageHeader title="Онолын сэдвүүд" description="Модуль үүсгэж, дотор нь шинэ сэдэв нэмнэ." action={<Button asChild><Link href="/admin/lessons/new"><Plus size={16}/>Сэдэв нэмэх</Link></Button>}/>
    <ModulesManager modules={modules} lessonCounts={lessonCounts}/>
    <LessonsTable lessons={lessons} moduleTitles={moduleTitles}/>
  </div>;
}
