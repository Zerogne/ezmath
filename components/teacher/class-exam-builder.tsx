"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Clock3, FileStack, FileText, Library, Minus, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClassExam } from "@/app/class-exam-actions";
import { MathText } from "@/components/math/math-text";
import { Button } from "@/components/ui/button";
import { formatScore } from "@/lib/class-exams/format";
import {
  MAX_CLASS_EXAM_ACTION_BYTES,
  serializedClassExamBytes,
  type ClassExamQuestionInput,
  type CreateClassExamInput,
} from "@/lib/class-exams/types";
import type { SchoolLibraryAnswerType } from "@/lib/supabase/database.types";

type Material = Omit<ClassExamQuestionInput, "localId" | "sourceMaterialId" | "maxPoints" | "saveToLibrary"> & { id: string; collectionId?: string | null; position?: number | null };
type Collection = { id: string; title: string; subject: string; year: number | null; variant: string | null; problems: Material[] };
type SelectedQuestion = ClassExamQuestionInput & { collectionId?: string | null; position?: number | null };

function toSelected(material: Material): SelectedQuestion {
  return { ...material, localId: `library:${material.id}`, sourceMaterialId: material.id, maxPoints: 1 };
}

/** Inserts a material's problem next to its siblings so a partial selection keeps the material's numbering order. */
function insertInOrder(current: SelectedQuestion[], item: SelectedQuestion) {
  if (!item.collectionId) return [...current, item];
  const after = current.findIndex((question) => question.collectionId === item.collectionId && (question.position ?? 0) > (item.position ?? 0));
  if (after >= 0) return [...current.slice(0, after), item, ...current.slice(after)];
  const lastSibling = current.findLastIndex((question) => question.collectionId === item.collectionId);
  return lastSibling >= 0 ? [...current.slice(0, lastSibling + 1), item, ...current.slice(lastSibling + 1)] : [...current, item];
}

function blankQuestion(): ClassExamQuestionInput {
  return {
    localId: crypto.randomUUID(),
    title: "",
    topic: "",
    questionLatex: "",
    answerType: "multiple_choice",
    answerKey: "A",
    choices: ["A", "B", "C", "D"].map((label) => ({ label, text: "" })),
    maxPoints: 1,
    saveToLibrary: false,
  };
}

export function ClassExamBuilder({ classroom, materials, collections }: { classroom: { id: string; name: string }; materials: Material[]; collections: Collection[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [duration, setDuration] = useState(45);
  const [mode, setMode] = useState<"draft" | "immediate" | "scheduled">("immediate");
  const [startsAt, setStartsAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [questions, setQuestions] = useState<SelectedQuestion[]>([]);
  const [libraryTab, setLibraryTab] = useState<"collections" | "problems">(collections.length || !materials.length ? "collections" : "problems");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<ClassExamQuestionInput | null>(null);
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const topics = useMemo(() => [...new Set(materials.map((material) => material.topic))].sort((a, b) => a.localeCompare(b, "mn")), [materials]);
  const visibleMaterials = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("mn");
    return materials.filter((material) => (topic === "all" || material.topic === topic) && (!term || `${material.title} ${material.topic} ${material.questionLatex}`.toLocaleLowerCase("mn").includes(term)));
  }, [materials, search, topic]);
  const visibleCollections = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("mn");
    return collections.filter((collection) => !term || `${collection.title} ${collection.subject} ${collection.year ?? ""}`.toLocaleLowerCase("mn").includes(term));
  }, [collections, search]);
  const selectedIds = new Set(questions.flatMap((question) => question.sourceMaterialId ? [question.sourceMaterialId] : []));
  const collectionTitles = new Map(collections.map((collection) => [collection.id, collection.title]));
  const totalPoints = questions.reduce((sum, question) => sum + Number(question.maxPoints || 0), 0);

  function toggleMaterial(material: Material) {
    if (selectedIds.has(material.id)) {
      setQuestions((current) => current.filter((question) => question.sourceMaterialId !== material.id));
      return;
    }
    setQuestions((current) => insertInOrder(current, toSelected(material)));
  }

  function toggleCollection(collection: Collection) {
    const allSelected = collection.problems.every((problem) => selectedIds.has(problem.id));
    if (allSelected) {
      const ids = new Set(collection.problems.map((problem) => problem.id));
      setQuestions((current) => current.filter((question) => !question.sourceMaterialId || !ids.has(question.sourceMaterialId)));
      return;
    }
    setQuestions((current) => collection.problems.filter((problem) => !selectedIds.has(problem.id)).reduce((list, problem) => insertInOrder(list, toSelected(problem)), current));
  }

  const toggleExpanded = (id: string) => setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  function saveAdHoc() {
    if (!draft) return;
    setQuestions((current) => [...current, draft]);
    setDraft(null);
  }

  function updateQuestion(localId: string, changes: Partial<ClassExamQuestionInput>) {
    setQuestions((current) => current.map((question) => question.localId === localId ? { ...question, ...changes } : question));
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    setQuestions((current) => {
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  function submit() {
    setError(null);
    const input: CreateClassExamInput = {
      classroomId: classroom.id,
      title,
      instructions,
      durationMinutes: duration,
      publishMode: mode,
      startsAt: toIso(startsAt),
      closesAt: mode === "draft" ? undefined : toIso(closesAt),
      questions: questions.map((question) => question.sourceMaterialId
        ? { sourceMaterialId: question.sourceMaterialId, maxPoints: question.maxPoints }
        : {
            title: question.title,
            topic: question.topic,
            questionLatex: question.questionLatex,
            answerType: question.answerType,
            answerKey: question.answerKey,
            choices: question.choices,
            maxPoints: question.maxPoints,
            saveToLibrary: question.saveToLibrary,
          }),
    };
    if (serializedClassExamBytes(input) > MAX_CLASS_EXAM_ACTION_BYTES) {
      setError("Агуулга хэт том байна. Текстээ богиносгоно уу.");
      return;
    }
    startTransition(async () => {
      const result = await createClassExam(input);
      if (result.error || !result.id) {
        setError(result.error || "Шалгалт үүсгэж чадсангүй.");
        return;
      }
      router.push(`/teacher/exams/${result.id}`);
    });
  }

  return (
    <div className="mt-7 space-y-6">
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Үндсэн мэдээлэл</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Шалгалтын нэр"><input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} className="h-11 rounded-xl border px-3" placeholder={`${classroom.name} — Сорил 01`}/></Field>
          <Field label="Хугацаа (минут)"><input type="number" min={1} max={600} value={duration} onChange={(event) => setDuration(Number(event.target.value))} className="h-11 rounded-xl border px-3"/></Field>
        </div>
        <div className="mt-4"><Field label="Сурагчид харагдах заавар"><textarea value={instructions} maxLength={5000} onChange={(event) => setInstructions(event.target.value)} rows={3} className="rounded-xl border p-3" placeholder="Калькулятор ашиглаж болно..."/></Field></div>
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Сургуулийн бодлогын сан</h2><p className="mt-1 text-sm text-muted-foreground">Материалыг бүтнээр нь эсвэл зарим бодлогыг нь сонгоно.</p></div><Button variant="secondary" onClick={() => setDraft(blankQuestion())}><Plus size={16}/>Шинэ асуулт бичих</Button></div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div role="tablist" aria-label="Сангийн төрөл" className="inline-flex shrink-0 rounded-xl border p-1">
            {([["collections", "Материал", FileStack, collections.length], ["problems", "Бодлого", FileText, materials.length]] as const).map(([value, label, Icon, count]) => <button key={value} type="button" role="tab" aria-selected={libraryTab === value} onClick={() => setLibraryTab(value)} className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${libraryTab === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon size={15}/>{label}<span className="text-xs opacity-75 tabular-nums">{count}</span></button>)}
          </div>
          <label className="relative flex-1"><span className="sr-only">Хайх</span><Search size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-muted-foreground"/><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full rounded-xl border pl-10 pr-3 text-sm" placeholder={libraryTab === "collections" ? "Материал хайх" : "Бодлого хайх"}/></label>
          {libraryTab === "problems" && <select value={topic} onChange={(event) => setTopic(event.target.value)} className="h-11 rounded-xl border bg-white px-3 text-sm"><option value="all">Бүх сэдэв</option>{topics.map((item) => <option key={item} value={item}>{item}</option>)}</select>}
        </div>
        {libraryTab === "collections" ? <div className="mt-4 space-y-3">
          {visibleCollections.map((collection) => {
            const count = collection.problems.filter((problem) => selectedIds.has(problem.id)).length;
            const all = count === collection.problems.length;
            const open = expanded.has(collection.id);
            return <div key={collection.id} className={`overflow-hidden rounded-xl border ${count ? "border-primary/50" : ""}`}>
              <div className={`flex items-center gap-3 p-3 sm:p-4 ${count ? "bg-primary/5" : ""}`}>
                <button type="button" onClick={() => toggleCollection(collection)} aria-label={all ? `${collection.title} — бүгдийг хасах` : `${collection.title} — бүгдийг сонгох`} className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${count ? "border-primary bg-primary text-white" : "bg-white"}`}>{all ? <Check size={14}/> : count ? <Minus size={14}/> : null}</button>
                <button type="button" onClick={() => toggleExpanded(collection.id)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{collection.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{[collection.subject, collection.year, collection.variant && `${collection.variant} хувилбар`, `${collection.problems.length} бодлого`].filter(Boolean).join(" · ")}</span></span>
                  {count > 0 && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white tabular-nums">{count}/{collection.problems.length}</span>}
                  <span className="hidden shrink-0 text-xs font-semibold text-primary sm:inline">{open ? "Хаах" : "Бодлого сонгох"}</span>
                  <ChevronDown size={17} className={`shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}/>
                </button>
              </div>
              {open && <ol className="max-h-[420px] divide-y overflow-y-auto border-t">
                {collection.problems.map((problem, index) => {
                  const selected = selectedIds.has(problem.id);
                  return <li key={problem.id}><button type="button" onClick={() => toggleMaterial(problem)} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/40 ${selected ? "bg-primary/5" : ""}`}>
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? "border-primary bg-primary text-white" : "bg-white"}`}>{selected && <Check size={12}/>}</span>
                    <span className="w-6 shrink-0 text-xs font-bold tabular-nums text-muted-foreground">{index + 1}.</span>
                    <span className="min-w-0 flex-1"><span className="line-clamp-2 text-sm leading-6"><MathText>{problem.questionLatex}</MathText></span><span className="mt-0.5 block text-[11px] text-muted-foreground">{problem.answerType === "multiple_choice" ? "Сонголттой" : problem.answerType === "numeric" ? "Тоон хариу" : "Задгай хариулт"}{problem.topic !== collection.subject ? ` · ${problem.topic}` : ""}</span></span>
                  </button></li>;
                })}
              </ol>}
            </div>;
          })}
          {!visibleCollections.length && <div className="rounded-xl bg-muted/50 px-5 py-10 text-center text-sm text-muted-foreground">{collections.length ? "Материал олдсонгүй." : "Сургуулийн санд материал алга. Бодлогын сан хэсэгт бүтэн материал нэмнэ үү."}</div>}
        </div> : <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {visibleMaterials.map((material) => {
            const selected = selectedIds.has(material.id);
            return <button key={material.id} type="button" onClick={() => toggleMaterial(material)} className={`rounded-xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5" : "hover:border-primary/30"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border ${selected ? "border-primary bg-primary text-white" : ""}`}>{selected && <Check size={14}/>}</span><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="font-semibold">{material.title}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{material.topic}</span></div><div className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground"><MathText>{material.questionLatex}</MathText></div></div></div></button>;
          })}
          {!visibleMaterials.length && <div className="col-span-full rounded-xl bg-muted/50 px-5 py-10 text-center text-sm text-muted-foreground">Бодлого олдсонгүй.</div>}
        </div>}
      </section>

      {draft && <AdHocEditor draft={draft} onChange={setDraft} onCancel={() => setDraft(null)} onSave={saveAdHoc}/>} 

      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Сонгосон асуултууд</h2><p className="mt-1 text-sm text-muted-foreground">{questions.length} асуулт · {formatScore(totalPoints)} оноо</p></div>{questions.length ? <Button size="sm" variant="ghost" className="text-red-700" onClick={() => setQuestions([])}><Trash2 size={14}/>Бүгдийг хасах</Button> : <Library size={20} className="text-primary"/>}</div>
        {questions.length ? <div className="mt-5 divide-y rounded-xl border">{questions.map((question, index) => <div key={question.localId} className="flex items-center gap-3 p-3 sm:p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{question.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{question.collectionId ? `${collectionTitles.get(question.collectionId) ?? "Материал"} · ${question.position}-р бодлого` : `${question.topic} · ${question.sourceMaterialId ? "Сангаас" : "Шинээр"}`}</p></div><label className="flex items-center gap-2 text-xs"><span>Оноо</span><input type="number" min="0.25" max="1000" step="0.25" value={question.maxPoints} onChange={(event) => updateQuestion(question.localId, { maxPoints: Number(event.target.value) })} className="h-9 w-20 rounded-lg border px-2"/></label><div className="flex"><IconButton label="Дээш" disabled={index === 0} onClick={() => moveQuestion(index, -1)}><ArrowUp size={15}/></IconButton><IconButton label="Доош" disabled={index === questions.length - 1} onClick={() => moveQuestion(index, 1)}><ArrowDown size={15}/></IconButton><IconButton label="Хасах" onClick={() => setQuestions((current) => current.filter((item) => item.localId !== question.localId))}><Trash2 size={15}/></IconButton></div></div>)}</div> : <div className="mt-5 rounded-xl border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">Сангаас сонгох эсвэл шинэ асуулт бичнэ үү.</div>}
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2"><Clock3 size={19} className="text-primary"/><h2 className="text-lg font-semibold">Эхлэх тохиргоо</h2></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">{([['draft','Ноорог','Дараа эхлүүлнэ'],['immediate','Одоо эхлүүлэх','Шууд сурагчдад нээнэ'],['scheduled','Цаг товлох','Товлосон үед нээгдэнэ']] as const).map(([value,label,note]) => <label key={value} className={`cursor-pointer rounded-xl border p-4 ${mode === value ? "border-primary bg-primary/5" : ""}`}><div className="flex items-center gap-2"><input type="radio" name="publish-mode" checked={mode === value} onChange={() => setMode(value)}/><span className="text-sm font-semibold">{label}</span></div><p className="mt-1 pl-5 text-xs text-muted-foreground">{note}</p></label>)}</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {mode === "scheduled" && <Field label="Эхлэх огноо, цаг"><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="h-11 rounded-xl border px-3"/></Field>}
          {mode !== "draft" && <Field label="Хаагдах огноо, цаг (заавал биш)"><input type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} className="h-11 rounded-xl border px-3"/></Field>}
        </div>
        <div className="mt-6 flex justify-end border-t pt-5"><Button onClick={submit} loading={pending} disabled={!questions.length}><Check size={16}/>{mode === "draft" ? "Ноорог хадгалах" : mode === "immediate" ? "Шалгалт эхлүүлэх" : "Шалгалт товлох"}</Button></div>
      </section>
    </div>
  );
}

function AdHocEditor({ draft, onChange, onCancel, onSave }: { draft: ClassExamQuestionInput; onChange: (draft: ClassExamQuestionInput) => void; onCancel: () => void; onSave: () => void }) {
  function changeType(answerType: SchoolLibraryAnswerType) {
    onChange({ ...draft, answerType, answerKey: answerType === "multiple_choice" ? "A" : "", choices: answerType === "multiple_choice" ? ["A", "B", "C", "D"].map((label) => ({ label, text: "" })) : [] });
  }
  function setChoice(index: number, text: string) { onChange({ ...draft, choices: draft.choices.map((choice, current) => current === index ? { ...choice, text } : choice) }); }
  function addChoice() { if (draft.choices.length < 8) onChange({ ...draft, choices: [...draft.choices, { label: String.fromCharCode(65 + draft.choices.length), text: "" }] }); }
  function removeChoice(index: number) {
    if (draft.choices.length <= 2) return;
    const choices = draft.choices.filter((_, current) => current !== index).map((choice, current) => ({ ...choice, label: String.fromCharCode(65 + current) }));
    onChange({ ...draft, choices, answerKey: "A" });
  }
  return <section className="rounded-2xl border-2 border-primary/20 bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[.12em] text-primary">AD HOC LATEX EDITOR</p><h2 className="mt-1 text-lg font-semibold">Шинэ асуулт</h2></div><IconButton label="Хаах" onClick={onCancel}><X size={18}/></IconButton></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Гарчиг"><input value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} className="h-11 rounded-xl border px-3"/></Field><Field label="Сэдэв / tag"><input value={draft.topic} onChange={(event) => onChange({ ...draft, topic: event.target.value })} className="h-11 rounded-xl border px-3"/></Field></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><Field label="Асуулт (LaTeX: $...$ эсвэл $$...$$)"><textarea value={draft.questionLatex} onChange={(event) => onChange({ ...draft, questionLatex: event.target.value })} rows={7} className="rounded-xl border p-3 font-mono text-sm"/></Field><div className="min-h-48 rounded-xl border bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">KaTeX preview</p><div className="mt-4 overflow-x-auto leading-8">{draft.questionLatex ? <MathText>{draft.questionLatex}</MathText> : <span className="text-sm text-muted-foreground">Асуултаа бичихэд энд харагдана.</span>}</div></div></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Хариултын төрөл"><select value={draft.answerType} onChange={(event) => changeType(event.target.value as SchoolLibraryAnswerType)} className="h-11 rounded-xl border bg-white px-3"><option value="multiple_choice">Сонголттой</option><option value="numeric">Тоон хариу</option><option value="free_response">Задгай хариулт</option></select></Field><Field label="Оноо"><input type="number" min="0.25" max="1000" step="0.25" value={draft.maxPoints} onChange={(event) => onChange({ ...draft, maxPoints: Number(event.target.value) })} className="h-11 rounded-xl border px-3"/></Field></div>
    {draft.answerType === "multiple_choice" ? <div className="mt-5"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Сонголтууд</h3><Button size="sm" variant="secondary" onClick={addChoice} disabled={draft.choices.length >= 8}><Plus size={14}/>Сонголт</Button></div><div className="mt-3 grid gap-3 sm:grid-cols-2">{draft.choices.map((choice,index) => <div key={`${choice.label}-${index}`} className="rounded-xl border p-3"><div className="flex items-center gap-2"><input type="radio" name="adhoc-correct" checked={draft.answerKey === choice.label} onChange={() => onChange({ ...draft, answerKey: choice.label })}/><span className="text-sm font-bold">{choice.label}.</span><input value={choice.text} onChange={(event) => setChoice(index,event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border px-2 font-mono text-sm"/><IconButton label="Сонголт устгах" disabled={draft.choices.length <= 2} onClick={() => removeChoice(index)}><Trash2 size={14}/></IconButton></div>{choice.text && <div className="mt-2 text-sm"><MathText>{choice.text}</MathText></div>}</div>)}</div></div> : <div className="mt-5 grid gap-4 lg:grid-cols-2"><Field label={draft.answerType === "numeric" ? "Зөв тоон хариу" : "Жишиг хариу / rubric"}><textarea value={draft.answerKey} onChange={(event) => onChange({ ...draft, answerKey: event.target.value })} rows={4} className="rounded-xl border p-3" placeholder={draft.answerType === "numeric" ? "12.5 (олон зөв утгыг | тэмдэгтээр салгаж болно)" : "Багшийн үнэлгээний заавар"}/></Field><div className="rounded-xl border bg-slate-50 p-4">{draft.answerKey ? <MathText>{draft.answerKey}</MathText> : <span className="text-sm text-muted-foreground">Хариултын preview</span>}</div></div>}
    <label className="mt-5 flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(draft.saveToLibrary)} onChange={(event) => onChange({ ...draft, saveToLibrary: event.target.checked })}/>Сангад мөн хадгалах</label>
    <div className="mt-6 flex justify-end gap-2 border-t pt-5"><Button variant="secondary" onClick={onCancel}>Болих</Button><Button onClick={onSave}><Plus size={15}/>Шалгалтад нэмэх</Button></div>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>; }
function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30">{children}</button>; }
function toIso(value: string) { if (!value) return undefined; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toISOString(); }
