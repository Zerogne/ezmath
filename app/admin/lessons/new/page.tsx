import { AdminPageHeader } from "@/components/admin/page-header";
import { LessonForm } from "@/components/admin/lessons/lesson-form";

export default function NewLessonPage() {
  return <div className="mx-auto max-w-[1280px]">
    <AdminPageHeader title="Шинэ сэдэв нэмэх" description="Мэдээлэл болон агуулгын хэсгүүдээ оруулна уу."/>
    <LessonForm/>
  </div>;
}
