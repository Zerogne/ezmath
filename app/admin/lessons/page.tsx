import Link from "next/link";
import { FileText, FolderTree, Layers } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ModuleMenu, NewModuleButton } from "@/components/admin/lessons/module-dialog";
import { Badge } from "@/components/ui/shadcn/badge";
import { getAdminLessonTree, type AdminMainModule } from "@/lib/data/admin-lessons";

export default async function AdminLessonsPage() {
  const tree = await getAdminLessonTree();
  const submoduleCount = tree.reduce((sum, main) => sum + main.submodules.length, 0);
  const lessons = tree.flatMap((main) => main.submodules.flatMap((sub) => sub.lessons));
  const drafts = lessons.filter((item) => item.status === "draft").length;

  return <div className="mx-auto max-w-[1280px] space-y-7">
    <AdminPageHeader title="Онолын сэдвүүд" description={`${tree.length} модуль · ${submoduleCount} дэд модуль · ${lessons.length} сэдэв${drafts ? ` (${drafts} draft)` : ""}`} action={<NewModuleButton/>}/>
    <ol className="grid gap-3 rounded-xl border bg-muted/30 p-4 text-sm sm:grid-cols-3">
      {[
        { icon: FolderTree, title: "1. Модуль", text: "Том сэдэв, жишээ нь “Алгебр”." },
        { icon: Layers, title: "2. Дэд модуль", text: "Модуль доторх бүлэг, “Квадрат тэгшитгэл”." },
        { icon: FileText, title: "3. Сэдэв", text: "Дэд модуль доторх унших хичээл." },
      ].map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background text-primary shadow-sm"><Icon size={16}/></span><span><span className="block font-semibold">{title}</span><span className="text-xs text-muted-foreground">{text}</span></span></li>)}
    </ol>
    {tree.length === 0
      ? <div className="rounded-xl border border-dashed px-6 py-14 text-center"><p className="font-semibold">Одоогоор модуль алга байна</p><p className="mt-1 text-sm text-muted-foreground">Эхний модулиа үүсгээд дотор нь дэд модуль, сэдвүүдээ нэмнэ.</p><div className="mt-5"><NewModuleButton/></div></div>
      : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tree.map((main, index) => <MainModuleCard key={main.id} main={main} index={index}/>)}</div>}
  </div>;
}

function MainModuleCard({ main, index }: { main: AdminMainModule; index: number }) {
  const lessons = main.submodules.flatMap((sub) => sub.lessons);
  const drafts = lessons.filter((item) => item.status === "draft").length;
  const shown = main.submodules.slice(0, 4);
  return <article className="relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* The ::after overlay makes the whole card clickable while keeping the menu below independently clickable. */}
          <h2 className="font-semibold"><Link href={`/admin/lessons/module/${main.id}`} className="after:absolute after:inset-0 after:rounded-xl hover:text-primary">{main.title}</Link></h2>
          {main.builtin && <Badge variant="secondary">Үндсэн</Badge>}
        </div>
        {main.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{main.description}</p>}
      </div>
      <div className="relative z-10 -mr-2 -mt-1"><ModuleMenu module={main} isSubmodule={false} builtin={main.builtin}/></div>
    </div>
    {main.submodules.length > 0
      ? <ul className="mt-4 flex flex-wrap gap-1.5">{shown.map((sub) => <li key={sub.id} className="rounded-md bg-muted px-2 py-1 text-xs">{sub.title}</li>)}{main.submodules.length > shown.length && <li className="px-1 py-1 text-xs text-muted-foreground">+{main.submodules.length - shown.length}</li>}</ul>
      : <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">Дэд модуль алга — сэдэв нэмэхийн тулд эхлээд дэд модуль үүсгэнэ.</p>}
    <div className="mt-auto pt-5"><div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><Layers size={13}/>{main.submodules.length} дэд модуль</span>
      <span className="inline-flex items-center gap-1.5"><FileText size={13}/>{lessons.length} сэдэв</span>
      {drafts > 0 && <span className="ml-auto font-medium text-amber-700">{drafts} draft</span>}
    </div></div>
  </article>;
}
