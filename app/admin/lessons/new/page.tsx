import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { LessonForm } from "@/components/admin/lessons/lesson-form";
import { getModule, listAllModules } from "@/lib/data/course-catalog";

export default async function NewLessonPage({ searchParams }: { searchParams: Promise<{ moduleId?: string }> }) {
  const { moduleId } = await searchParams;
  const [modules, lockedModule] = await Promise.all([
    listAllModules(),
    moduleId ? getModule(moduleId) : Promise.resolve(undefined),
  ]);
  return <div className="mx-auto max-w-[1280px]">
    {lockedModule && <Link href={`/admin/lessons/module/${lockedModule.id}`} className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>{lockedModule.title}</Link>}
    <AdminPageHeader title="Шинэ сэдэв нэмэх" description="Мэдээлэл болон агуулгын хэсгүүдээ оруулна уу."/>
    <LessonForm modules={modules} lockedModule={lockedModule ? { id: lockedModule.id, title: lockedModule.title } : undefined}/>
  </div>;
}
