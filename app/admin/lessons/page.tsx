import { LessonForm } from "@/components/admin/lessons/lesson-form";
import { LessonsTable } from "@/components/admin/lessons/lessons-table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminLessonsPage() {
  const data = isSupabaseConfigured() ? (await (await createClient()).from("course_lessons").select("id,title,module_id,status,duration_minutes,slug").order("created_at", { ascending: false }).limit(100)).data : [];
  return <div className="mx-auto max-w-[1280px]">
    <AdminPageHeader title="Онолын сэдвүүд" description="Шинэ сэдэв үүсгэж, тохирох хичээлд нийтэлнэ."/>
    {!!data?.length && <div className="mt-7"><LessonsTable lessons={data}/></div>}
    <div className="mt-8"><LessonForm/></div>
  </div>;
}
