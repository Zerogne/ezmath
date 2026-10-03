import { AdminPageHeader } from "@/components/admin/page-header";
import { LessonForm } from "@/components/admin/lessons/lesson-form";
import { listAllModules } from "@/lib/data/course-catalog";

export default async function NewLessonPage() {
  const modules = await listAllModules();
  return <div className="mx-auto max-w-[1280px]">
    <AdminPageHeader title="Шинэ сэдэв нэмэх" description="Мэдээлэл болон агуулгын хэсгүүдээ оруулна уу."/>
    <LessonForm modules={modules}/>
  </div>;
}
