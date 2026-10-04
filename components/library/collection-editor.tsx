"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Copy, Eye, Plus, Save, Trash2 } from "lucide-react";
import { deleteLibraryCollection, saveLibraryCollection, type LibraryCollectionProblemInput } from "@/app/library-actions";
import { MathText } from "@/components/math/math-text";
import { Button } from "@/components/ui/button";
import type { LibraryCollection } from "@/lib/data/school-library";
import { answerTypeLabels, blankChoices, Field, ProblemFields } from "./problem-fields";

type ProblemRow = LibraryCollectionProblemInput & { key: string; topic: string };

const SUBJECTS = ["Математик", "Физик", "Хими", "Биологи", "Англи хэл", "Монгол хэл", "Газар зүй", "Нийгэм судлал"];
const YEARS = Array.from({ length: 21 }, (_, index) => 2026 - index);

function blankProblem(): ProblemRow {
  return { key: crypto.randomUUID(), topic: "", questionLatex: "", answerType: "multiple_choice", answerKey: "A", choices: blankChoices(5) };
}

function isIncomplete(problem: ProblemRow) {
  if (!problem.questionLatex.trim()) return true;
  if (problem.answerType === "multiple_choice") return problem.choices.some((choice) => !choice.text.trim()) || !problem.choices.some((choice) => choice.label === problem.answerKey);
  return !problem.answerKey.trim();
}

export function CollectionEditor({ collection, basePath, canEdit }: { collection: LibraryCollection | null; basePath: string; canEdit: boolean }) {
  const router = useRouter();
  const [title, setTitle] = useState(collection?.title ?? "");
  const [subject, setSubject] = useState(collection?.subject ?? "Математик");
  const [year, setYear] = useState<number | "">(collection?.year ?? "");
  const [variant, setVariant] = useState(collection?.variant ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [problems, setProblems] = useState<ProblemRow[]>(() => collection?.problems.length
    ? collection.problems.map((problem) => ({ key: problem.id, id: problem.id, title: problem.title, topic: problem.topic === collection.subject ? "" : problem.topic, questionLatex: problem.questionLatex, answerType: problem.answerType, answerKey: problem.answerKey, choices: problem.choices }))
    : [blankProblem()]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(collection ? [] : [problems[0].key]));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const incomplete = useMemo(() => problems.filter(isIncomplete).length, [problems]);
  const typeCounts = useMemo(() => problems.reduce<Record<string, number>>((counts, problem) => ({ ...counts, [problem.answerType]: (counts[problem.answerType] ?? 0) + 1 }), {}), [problems]);
  const readOnly = !canEdit;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const touch = () => { setDirty(true); setMessage(null); };
  const setField = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); touch(); };
  const updateProblem = (key: string, next: ProblemRow) => { setProblems((items) => items.map((item) => item.key === key ? next : item)); touch(); };
  const toggle = (key: string) => setOpen((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  function addProblem() {
    const problem = blankProblem();
    setProblems((items) => [...items, problem]);
    setOpen((current) => new Set(current).add(problem.key));
    touch();
    window.setTimeout(() => document.getElementById(`problem-${problem.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }
  function duplicate(index: number) {
    const source = problems[index];
    const copy: ProblemRow = { ...source, key: crypto.randomUUID(), id: undefined, title: undefined, choices: source.choices.map((choice) => ({ ...choice })) };
    setProblems((items) => [...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
    setOpen((current) => new Set(current).add(copy.key));
    touch();
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= problems.length) return;
    setProblems((items) => { const copy = [...items]; [copy[index], copy[target]] = [copy[target], copy[index]]; return copy; });
    touch();
  }
  function remove(index: number) {
    if (problems.length <= 1) return;
    setProblems((items) => items.filter((_, current) => current !== index));
    touch();
  }

  function save() {
    setError(null);
    setMessage(null);
    if (incomplete) {
      setError(`${incomplete} бодлого дутуу байна. Асуулт болон зөв хариуг бөглөнө үү.`);
      setOpen(new Set(problems.filter(isIncomplete).map((problem) => problem.key)));
      return;
    }
    startTransition(async () => {
      const result = await saveLibraryCollection({
        id: collection?.id,
        title,
        subject,
        year: year || null,
        variant: variant || null,
        description,
        // Problem titles are regenerated from the material name and number on every save.
        problems: problems.map((problem) => ({ id: problem.id, topic: problem.topic, questionLatex: problem.questionLatex, answerType: problem.answerType, answerKey: problem.answerKey, choices: problem.choices })),
      });
      if (result.error || !result.id) { setError(result.error ?? "Материал хадгалж чадсангүй."); return; }
      setDirty(false);
      setMessage("Материал хадгалагдлаа.");
      if (!collection) router.replace(`${basePath}/collections/${result.id}`);
      else router.refresh();
    });
  }

  function destroy() {
    if (!collection) return;
    setConfirmDelete(false);
    startTransition(async () => {
      const result = await deleteLibraryCollection(collection.id);
      if (result.error) { setError(result.error); return; }
      setDirty(false);
      router.push(basePath);
    });
  }

  return <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="min-w-0 space-y-6">
      {readOnly && <p className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"><Eye size={16}/>Өөр багшийн материал тул зөвхөн харах боломжтой. Шалгалт үүсгэхдээ ашиглаж болно.</p>}
      <section className="rounded-2xl border bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Материалын мэдээлэл</h2>
        <fieldset disabled={readOnly} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Материалын нэр" className="sm:col-span-2 lg:col-span-4"><input value={title} maxLength={160} onChange={(event) => setField(setTitle)(event.target.value)} className="h-11 rounded-xl border px-3" placeholder="ЭЕШ Математик 2024 — Хувилбар A"/></Field>
          <Field label="Хичээл"><input list="library-subjects" value={subject} maxLength={80} onChange={(event) => setField(setSubject)(event.target.value)} className="h-11 rounded-xl border px-3"/><datalist id="library-subjects">{SUBJECTS.map((item) => <option key={item} value={item}/>)}</datalist></Field>
          <Field label="Он — заавал биш"><select value={year} onChange={(event) => setField(setYear)(event.target.value ? Number(event.target.value) : "")} className="h-11 rounded-xl border bg-white px-3"><option value="">—</option>{YEARS.map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Хувилбар — заавал биш"><select value={variant} onChange={(event) => setField(setVariant)(event.target.value)} className="h-11 rounded-xl border bg-white px-3"><option value="">—</option>{["A", "B", "C", "D", "E"].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Тайлбар — заавал биш" className="sm:col-span-2 lg:col-span-4"><textarea value={description} maxLength={2000} onChange={(event) => setField(setDescription)(event.target.value)} rows={2} className="rounded-xl border p-3" placeholder="Жишээ: I хэсэг 1–36 сонгох, II хэсэг 37–40 нөхөх"/></Field>
        </fieldset>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-semibold">Бодлогууд</h2><p className="mt-0.5 text-xs text-muted-foreground">Дугаарын дарааллаар шалгалтад орно. Дарж нээгээд засна.</p></div>
          {!readOnly && <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setOpen(open.size ? new Set() : new Set(problems.map((problem) => problem.key)))}>{open.size ? "Бүгдийг хаах" : "Бүгдийг нээх"}</Button></div>}
        </div>
        <ol className="space-y-2">
          {problems.map((problem, index) => {
            const expanded = open.has(problem.key);
            const missing = isIncomplete(problem);
            return <li key={problem.key} id={`problem-${problem.key}`} className={`overflow-hidden rounded-xl border bg-white ${expanded ? "shadow-sm" : ""}`}>
              <button type="button" onClick={() => toggle(problem.key)} aria-expanded={expanded} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40">
                <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-muted px-1.5 text-xs font-bold tabular-nums">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{problem.questionLatex.trim() ? <MathText>{problem.questionLatex.split("\n")[0].slice(0, 140)}</MathText> : <span className="text-muted-foreground">Хоосон бодлого</span>}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{answerTypeLabels[problem.answerType]}{problem.answerType === "multiple_choice" && problem.answerKey ? ` · Зөв: ${problem.answerKey}` : ""}{problem.topic ? ` · ${problem.topic}` : ""}</span>
                </span>
                {missing && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800"><AlertTriangle size={12}/>Дутуу</span>}
                <ChevronDown size={17} className={`shrink-0 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`}/>
              </button>
              {expanded && <div className="border-t p-4 sm:p-5">
                <ProblemFields draft={problem} idPrefix={`problem-${problem.key}`} disabled={readOnly} onChange={(next) => updateProblem(problem.key, next)}/>
                <fieldset disabled={readOnly} className="mt-4 max-w-sm"><Field label="Сэдэв / tag — заавал биш"><input value={problem.topic} maxLength={80} onChange={(event) => updateProblem(problem.key, { ...problem, topic: event.target.value })} className="h-10 rounded-xl border px-3 text-sm" placeholder={`Хоосон бол “${subject || "хичээл"}”`}/></Field></fieldset>
                {!readOnly && <div className="mt-5 flex flex-wrap gap-1 border-t pt-4">
                  <Button size="sm" variant="ghost" onClick={() => duplicate(index)}><Copy size={14}/>Хуулах</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}><ChevronUp size={14}/>Дээш</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === problems.length - 1}><ChevronDown size={14}/>Доош</Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-red-700" onClick={() => remove(index)} disabled={problems.length <= 1}><Trash2 size={14}/>Устгах</Button>
                </div>}
              </div>}
            </li>;
          })}
        </ol>
        {!readOnly && <button type="button" onClick={addProblem} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"><Plus size={16}/>{problems.length + 1}-р бодлого нэмэх</button>}
      </section>
    </div>

    <aside>
      <div className="space-y-4 xl:sticky xl:top-24">
        <Link href={basePath} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Бодлогын сан</Link>
        <section className="rounded-2xl border bg-white p-5">
          <p className="text-3xl font-semibold tabular-nums">{problems.length}<span className="ml-1.5 text-sm font-medium text-muted-foreground">бодлого</span></p>
          <dl className="mt-3 space-y-1.5 text-sm">{Object.entries(answerTypeLabels).filter(([type]) => typeCounts[type]).map(([type, label]) => <div key={type} className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd className="font-medium tabular-nums">{typeCounts[type]}</dd></div>)}</dl>
          {incomplete > 0 && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800">{incomplete} бодлого дутуу — хадгалахаас өмнө бөглөнө үү.</p>}
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          {message && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{message}</p>}
          {!readOnly && <div className="mt-5 grid gap-2">
            <Button onClick={save} loading={pending}><Save size={16}/>{pending ? "Хадгалж байна…" : collection ? "Хадгалах" : "Материал үүсгэх"}</Button>
            {collection && (confirmDelete
              ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"><p>Материал болон {problems.length} бодлогыг устгах уу? Өмнө өгсөн шалгалтууд хэвээр үлдэнэ.</p><div className="mt-3 flex gap-2"><Button size="sm" variant="danger" onClick={destroy} loading={pending}>Устгах</Button><Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>Болих</Button></div></div>
              : <Button variant="ghost" className="text-red-700" onClick={() => setConfirmDelete(true)}><Trash2 size={15}/>Материал устгах</Button>)}
          </div>}
          {dirty && !readOnly && <p className="mt-3 text-center text-[11px] text-amber-700">Хадгалаагүй өөрчлөлт байна</p>}
        </section>
      </div>
    </aside>
  </div>;
}
