import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Layers, Plus } from "lucide-react";
import { LessonBreadcrumbs } from "@/components/admin/lessons/breadcrumbs";
import { LessonList } from "@/components/admin/lessons/lesson-list";
import { ModuleMenu, NewModuleButton } from "@/components/admin/lessons/module-dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { findInTree, getAdminLessonTree, type AdminMainModule, type AdminSubmodule } from "@/lib/data/admin-lessons";

export default async function AdminModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const tree = await getAdminLessonTree();
  const found = findInTree(tree, moduleId);
  if (!found) notFound();
  return found.sub ? <SubmoduleView main={found.main} sub={found.sub}/> : <MainModuleView main={found.main} index={tree.indexOf(found.main)}/>;
}

function ModuleHeader({ title, description, builtin, eyebrow, actions }: { title: string; description: string; builtin: boolean; eyebrow: string; actions: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{title}</h1>{builtin && <Badge variant="secondary">Үндсэн</Badge>}</div>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">{actions}</div>
  </div>;
}

function AddLessonButton({ submoduleId, variant, size }: { submoduleId: string; variant?: "default" | "outline"; size?: "default" | "sm" }) {
  return <Button asChild variant={variant} size={size}><Link href={`/admin/lessons/new?moduleId=${submoduleId}`}><Plus size={15}/>Сэдэв нэмэх</Link></Button>;
}

function MainModuleView({ main, index }: { main: AdminMainModule; index: number }) {
  const lessonCount = main.submodules.reduce((sum, sub) => sum + sub.lessons.length, 0);
  return <div className="mx-auto max-w-[1280px] space-y-6">
    <div>
      <LessonBreadcrumbs items={[{ label: "Модулиуд", href: "/admin/lessons" }, { label: main.title }]}/>
      <ModuleHeader
        eyebrow={`Модуль ${String(index + 1).padStart(2, "0")} · ${main.submodules.length} дэд модуль · ${lessonCount} сэдэв`}
        title={main.title} description={main.description} builtin={main.builtin}
        actions={<><ModuleMenu module={main} isSubmodule={false} builtin={main.builtin} redirectTo="/admin/lessons"/><NewModuleButton parent={{ id: main.id, title: main.title }}/></>}
      />
    </div>

    {main.orphanLessons.length > 0 && <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/50">
      <div className="flex items-start gap-3 p-4"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600"/><div><h2 className="font-semibold">Дэд модульгүй сэдвүүд</h2><p className="mt-0.5 text-sm text-muted-foreground">Эдгээр нь сурагчдад харагдахгүй. Сэдвийг нээгээд дэд модуль сонгож хадгална уу.</p></div></div>
      <div className="border-t border-amber-200 bg-card"><LessonList lessons={main.orphanLessons}/></div>
    </section>}

    {main.submodules.length === 0
      ? <div className="rounded-xl border border-dashed px-6 py-14 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary"><Layers size={20}/></span>
        <p className="mt-4 font-semibold">Дэд модуль алга байна</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Сэдвүүд дэд модуль дотор хадгалагдана. Эхний дэд модулиа үүсгээд дотор нь сэдвээ нэмнэ үү.</p>
        <div className="mt-5"><NewModuleButton parent={{ id: main.id, title: main.title }}/></div>
      </div>
      : <div className="space-y-4">{main.submodules.map((sub, subIndex) => <SubmoduleCard key={sub.id} sub={sub} label={`${index + 1}.${subIndex + 1}`}/>)}</div>}
  </div>;
}

function SubmoduleCard({ sub, label }: { sub: AdminSubmodule; label: string }) {
  const drafts = sub.lessons.filter((item) => item.status === "draft").length;
  return <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
    <header className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-3">
      <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-background px-2 text-xs font-bold text-primary ring-1 ring-border">{label}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/lessons/module/${sub.id}`} className="font-semibold hover:text-primary">{sub.title}</Link>{sub.builtin && <Badge variant="secondary">Үндсэн</Badge>}</div>
        <p className="truncate text-xs text-muted-foreground">{sub.lessons.length} сэдэв{drafts ? ` · ${drafts} draft` : ""}{sub.description ? ` · ${sub.description}` : ""}</p>
      </div>
      <div className="flex items-center gap-1"><AddLessonButton submoduleId={sub.id} variant="outline" size="sm"/><ModuleMenu module={sub} isSubmodule builtin={sub.builtin}/></div>
    </header>
    <LessonList lessons={sub.lessons} emptyLabel="Сэдэв алга. “Сэдэв нэмэх” дарж эхний сэдвээ бичнэ үү."/>
  </section>;
}

function SubmoduleView({ main, sub }: { main: AdminMainModule; sub: AdminSubmodule }) {
  const mainHref = `/admin/lessons/module/${main.id}`;
  return <div className="mx-auto max-w-[1280px] space-y-6">
    <div>
      <LessonBreadcrumbs items={[{ label: "Модулиуд", href: "/admin/lessons" }, { label: main.title, href: mainHref }, { label: sub.title }]}/>
      <ModuleHeader
        eyebrow={`Дэд модуль · ${sub.lessons.length} сэдэв`}
        title={sub.title} description={sub.description} builtin={sub.builtin}
        actions={<><ModuleMenu module={sub} isSubmodule builtin={sub.builtin} redirectTo={mainHref}/><AddLessonButton submoduleId={sub.id}/></>}
      />
    </div>
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm"><LessonList lessons={sub.lessons} emptyLabel="Сэдэв алга. “Сэдэв нэмэх” дарж эхний сэдвээ бичнэ үү."/></section>
  </div>;
}
