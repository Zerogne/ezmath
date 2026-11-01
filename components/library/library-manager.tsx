"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Edit3, FileStack, FileText, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteLibraryMaterial, saveLibraryMaterial, type LibraryMaterialInput } from "@/app/library-actions";
import { MathText } from "@/components/math/math-text";
import { Button, ButtonLink } from "@/components/ui/button";
import type { LibraryCollectionSummary, LibraryMaterial } from "@/lib/data/school-library";
import { answerTypeLabels, blankChoices, Field, ProblemFields } from "./problem-fields";
import { EmptyState } from "@/components/ui/empty-state";

type Tab = "collections" | "problems";

function newDraft(): LibraryMaterialInput {
  return { title: "", topic: "", questionLatex: "", answerType: "multiple_choice", answerKey: "A", choices: blankChoices() };
}

function editDraft(material: LibraryMaterial): LibraryMaterialInput {
  return { id: material.id, title: material.title, topic: material.topic, questionLatex: material.questionLatex, answerType: material.answerType, answerKey: material.answerKey, choices: material.choices };
}

export function LibraryManager({ materials, collections, currentUserId, canManageAll, basePath }: { materials: LibraryMaterial[]; collections: LibraryCollectionSummary[]; currentUserId: string; canManageAll: boolean; basePath: string }) {
  const [tab, setTab] = useState<Tab>("collections");
  return <div className="mt-7 space-y-6">
    <div role="tablist" aria-label="Бодлогын сан" className="inline-flex rounded-xl border bg-white p-1">
      {([["collections", "Материал", FileStack, collections.length], ["problems", "Бодлого", FileText, materials.length]] as const).map(([value, label, Icon, count]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${tab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon size={15}/>{label}<span className={`rounded-full px-1.5 text-[11px] tabular-nums ${tab === value ? "bg-white/20" : "bg-muted"}`}>{count}</span></button>)}
    </div>
    {tab === "collections"
      ? <CollectionsTab collections={collections} currentUserId={currentUserId} canManageAll={canManageAll} basePath={basePath}/>
      : <ProblemsTab materials={materials} currentUserId={currentUserId} canManageAll={canManageAll}/>}
  </div>;
}

function CollectionsTab({ collections, currentUserId, canManageAll, basePath }: { collections: LibraryCollectionSummary[]; currentUserId: string; canManageAll: boolean; basePath: string }) {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const subjects = useMemo(() => [...new Set(collections.map((item) => item.subject))].sort((a, b) => a.localeCompare(b, "mn")), [collections]);
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("mn");
    return collections.filter((item) => (subject === "all" || item.subject === subject) && (!term || `${item.title} ${item.subject} ${item.year ?? ""}`.toLocaleLowerCase("mn").includes(term)));
  }, [collections, search, subject]);

  return <div className="space-y-4">
    <Toolbar search={search} onSearch={setSearch} filter={subject} onFilter={setSubject} filterLabel="Бүх хичээл" options={subjects} placeholder="Материалын нэр, хичээл, оноор хайх" action={<ButtonLink href={`${basePath}/collections/new`}><Plus size={17}/>Шинэ материал</ButtonLink>}/>
    {visible.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((item) => {
        const mine = item.createdBy === currentUserId;
        return <Link key={item.id} href={`${basePath}/collections/${item.id}`} className="group flex flex-col rounded-2xl border bg-white p-5 transition hover:border-primary/40 hover:shadow-md">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileStack size={18}/></span>
            <div className="min-w-0 flex-1"><h3 className="truncate font-semibold group-hover:text-primary" title={item.title}>{item.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{[item.subject, item.year, item.variant && `${item.variant} хувилбар`].filter(Boolean).join(" · ")}</p></div>
          </div>
          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.description}</p>
          <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
            <span className="font-semibold tabular-nums">{item.problemCount} бодлого</span>
            {mine ? <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">Миний</span> : canManageAll ? <span className="text-muted-foreground">Засах боломжтой</span> : <span className="text-muted-foreground">Зөвхөн харах</span>}
          </div>
        </Link>;
      })}
    </div> : <Empty title={collections.length ? "Материал олдсонгүй" : "Одоогоор материал алга"} text={collections.length ? "Шүүлтүүрээ өөрчилнө үү." : "ЭЕШ-ийн хувилбар шиг бүтэн материалаа бодлого бүрээр нь оруулаад шалгалтад ашиглана."}/>}
  </div>;
}

function ProblemsTab({ materials, currentUserId, canManageAll }: { materials: LibraryMaterial[]; currentUserId: string; canManageAll: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<LibraryMaterialInput | null>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topics = useMemo(() => [...new Set(materials.map((material) => material.topic))].sort((a, b) => a.localeCompare(b, "mn")), [materials]);
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("mn");
    return materials.filter((material) => (topic === "all" || material.topic === topic) && (!term || `${material.title} ${material.topic} ${material.questionLatex}`.toLocaleLowerCase("mn").includes(term)));
  }, [materials, search, topic]);

  function begin(next: LibraryMaterialInput) {
    setDraft(next);
    setError(null);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function save() {
    if (!draft) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await saveLibraryMaterial(draft);
      if (result.error) { setError(result.error); return; }
      setDraft(null);
      setMessage(draft.id ? "Бодлого шинэчлэгдлээ." : "Бодлого санд нэмэгдлээ.");
      router.refresh();
    });
  }

  function remove(material: LibraryMaterial) {
    if (!window.confirm(`“${material.title}” бодлогыг устгах уу?`)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteLibraryMaterial(material.id);
      if (result.error) { setError(result.error); return; }
      if (draft?.id === material.id) setDraft(null);
      setMessage("Бодлого устгагдлаа.");
      router.refresh();
    });
  }

  return <div className="space-y-4">
    <Toolbar search={search} onSearch={setSearch} filter={topic} onFilter={setTopic} filterLabel="Бүх сэдэв" options={topics} placeholder="Гарчиг, сэдэв, асуултаар хайх" action={<Button onClick={() => begin(newDraft())}><Plus size={17}/>Шинэ бодлого</Button>}/>
    {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {draft && <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">{draft.id ? "Бодлого засах" : "Шинэ бодлого"}</h2><button type="button" onClick={() => setDraft(null)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted" aria-label="Editor хаах"><X size={18}/></button></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Гарчиг"><input value={draft.title} maxLength={160} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="h-11 rounded-xl border px-3" placeholder="Квадрат тэгшитгэл — 01"/></Field>
        <Field label="Сэдэв / tag"><input value={draft.topic} maxLength={80} onChange={(event) => setDraft({ ...draft, topic: event.target.value })} className="h-11 rounded-xl border px-3" placeholder="Алгебр"/></Field>
      </div>
      <div className="mt-4"><ProblemFields draft={draft} idPrefix="single-problem" onChange={setDraft}/></div>
      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-5"><Button variant="secondary" onClick={() => setDraft(null)}>Болих</Button><Button onClick={save} loading={pending}><Check size={16}/>{draft.id ? "Өөрчлөлт хадгалах" : "Санд нэмэх"}</Button></div>
    </section>}
    {visible.length ? <section className="divide-y overflow-hidden rounded-2xl border bg-white">
      {visible.map((material) => {
        const canEdit = canManageAll || material.createdBy === currentUserId;
        return <article key={material.id} className="px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{material.title}</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{material.topic}</span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{answerTypeLabels[material.answerType]}</span>
                {material.createdBy === currentUserId && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Миний</span>}
              </div>
              <div className="mt-3 overflow-x-auto text-sm leading-7"><MathText>{material.questionLatex}</MathText></div>
              {material.answerType === "multiple_choice" && <div className="mt-3 grid gap-2 sm:grid-cols-2">{material.choices.map((choice) => <div key={choice.label} className={`rounded-lg border px-3 py-2 text-sm ${choice.label === material.answerKey ? "border-emerald-300 bg-emerald-50" : "bg-slate-50"}`}><span className="mr-2 font-bold">{choice.label}.</span><MathText>{choice.text}</MathText></div>)}</div>}
              {material.answerType !== "multiple_choice" && <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{material.answerType === "numeric" ? "Зөв хариу:" : "Жишиг хариу:"}</span> {material.answerKey}</p>}
            </div>
            {canEdit && <div className="flex shrink-0 gap-2"><Button size="sm" variant="secondary" onClick={() => begin(editDraft(material))}><Edit3 size={14}/>Засах</Button><Button size="sm" variant="ghost" className="text-red-700" disabled={pending} onClick={() => remove(material)} aria-label={`${material.title} бодлогыг устгах`}><Trash2 size={15}/></Button></div>}
          </div>
        </article>;
      })}
    </section> : <Empty title={materials.length ? "Бодлого олдсонгүй" : "Одоогоор ганц бодлого алга"} text={materials.length ? "Шүүлтүүрээ өөрчилнө үү." : "Материалд хамааралгүй бие даасан бодлогуудаа энд нэг нэгээр нэмнэ."}/>}
  </div>;
}

function Toolbar({ search, onSearch, filter, onFilter, filterLabel, options, placeholder, action }: { search: string; onSearch: (value: string) => void; filter: string; onFilter: (value: string) => void; filterLabel: string; options: string[]; placeholder: string; action: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
      <label className="relative max-w-md flex-1"><span className="sr-only">Хайх</span><Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-muted-foreground" aria-hidden="true"/><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm"/></label>
      <label><span className="sr-only">{filterLabel}</span><select value={filter} onChange={(event) => onFilter(event.target.value)} className="h-11 min-w-44 rounded-xl border bg-white px-3 text-sm"><option value="all">{filterLabel}</option>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>
    {action}
  </div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <EmptyState pose="sleep" title={title} text={text}/>;
}
