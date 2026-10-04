import { AdminPageHeader } from "@/components/admin/page-header";
import { LessonBreadcrumbs } from "@/components/admin/lessons/breadcrumbs";
import { LessonForm } from "@/components/admin/lessons/lesson-form";
import { listAllModules } from "@/lib/data/course-catalog";
import { moduleTrail, toModuleGroups } from "@/lib/data/admin-lessons";

export default async function NewLessonPage({ searchParams }: { searchParams: Promise<{ moduleId?: string }> }) {
  const { moduleId } = await searchParams;
  const modules = await listAllModules();
  const trail = moduleId ? moduleTrail(modules, moduleId) : [];
  // Only a submodule (two-item trail) can hold lessons; anything else falls back to the picker.
  const locked = trail.length === 2 ? trail[1] : undefined;
  return <div className="mx-auto max-w-[1280px]">
    <LessonBreadcrumbs items={[{ label: "Модулиуд", href: "/admin/lessons" }, ...trail.map((item) => ({ label: item.title, href: `/admin/lessons/module/${item.id}` })), { label: "Шинэ сэдэв" }]}/>
    <AdminPageHeader title="Шинэ сэдэв нэмэх" description="Мэдээлэл болон агуулгын хэсгүүдээ оруулаад Draft эсвэл Published төлөвтэй хадгална."/>
    <LessonForm moduleGroups={toModuleGroups(modules)} lockedModule={locked ? { id: locked.id, path: trail.map((item) => item.title).join(" / ") } : undefined}/>
  </div>;
}
