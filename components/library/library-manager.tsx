"use client";

import { useMemo, useState, useTransition } from "react";
import { BookOpen, Check, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteLibraryMaterial, saveLibraryMaterial, type LibraryMaterialInput } from "@/app/library-actions";
import { MathText } from "@/components/math/math-text";
import { Button } from "@/components/ui/button";
import type { LibraryMaterial } from "@/lib/data/school-library";
import type { SchoolLibraryAnswerType } from "@/lib/supabase/database.types";

const answerTypeLabels: Record<SchoolLibraryAnswerType, string> = {
  multiple_choice: "Сонголттой",
  numeric: "Тоон хариу",
  free_response: "Задгай хариулт",
};

function newDraft(): LibraryMaterialInput {
  return {
    title: "",
    topic: "",
    questionLatex: "",
    answerType: "multiple_choice",
    answerKey: "A",
    choices: ["A", "B", "C", "D"].map((label) => ({ label, text: "" })),
  };
}

function editDraft(material: LibraryMaterial): LibraryMaterialInput {
  return {
    id: material.id,
    title: material.title,
    topic: material.topic,
    questionLatex: material.questionLatex,
    answerType: material.answerType,
    answerKey: material.answerKey,
    choices: material.choices,
  };
}

export function LibraryManager({ materials, currentUserId, canManageAll }: { materials: LibraryMaterial[]; currentUserId: string; canManageAll: boolean }) {
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
    return materials.filter((material) => {
      const matchesTopic = topic === "all" || material.topic === topic;
      const matchesSearch = !term || `${material.title} ${material.topic} ${material.questionLatex}`.toLocaleLowerCase("mn").includes(term);
      return matchesTopic && matchesSearch;
    });
  }, [materials, search, topic]);

  function beginCreate() {
    setDraft(newDraft());
    setError(null);
    setMessage(null);
  }

  function beginEdit(material: LibraryMaterial) {
    setDraft(editDraft(material));
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
      if (result.error) {
        setError(result.error);
        return;
      }
      setDraft(null);
      setMessage(draft.id ? "Материал амжилттай шинэчлэгдлээ." : "Материал бодлогын санд нэмэгдлээ.");
      router.refresh();
    });
  }

  function remove(material: LibraryMaterial) {
    if (!window.confirm(`“${material.title}” материалыг устгах уу?`)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await deleteLibraryMaterial(material.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (draft?.id === material.id) setDraft(null);
      setMessage("Материал устгагдлаа.");
      router.refresh();
    });
  }

  return (
    <div className="mt-7 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="relative max-w-md flex-1">
            <span className="sr-only">Материал хайх</span>
            <Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-muted-foreground" aria-hidden="true"/>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Гарчиг, сэдэв, асуултаар хайх" className="h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm"/>
          </label>
          <label>
            <span className="sr-only">Сэдвээр шүүх</span>
            <select value={topic} onChange={(event) => setTopic(event.target.value)} className="h-11 min-w-48 rounded-xl border bg-white px-3 text-sm">
              <option value="all">Бүх сэдэв</option>
              {topics.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <Button onClick={beginCreate}><Plus size={17}/>Шинэ материал</Button>
      </div>

      {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {draft && <MaterialEditor draft={draft} pending={pending} onChange={setDraft} onCancel={() => setDraft(null)} onSave={save}/>} 

      <section className="overflow-hidden rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div><h2 className="font-semibold">Сургуулийн материалууд</h2><p className="mt-1 text-xs text-muted-foreground">{visible.length} материал харагдаж байна.</p></div>
          <BookOpen size={19} className="text-primary" aria-hidden="true"/>
        </div>
        {visible.length ? (
          <div className="divide-y">
            {visible.map((material) => {
              const canEdit = canManageAll || material.createdBy === currentUserId;
              return (
                <article key={material.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{material.title}</h3>
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{material.topic}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{answerTypeLabels[material.answerType]}</span>
                        {material.createdBy === currentUserId && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Миний материал</span>}
                      </div>
                      <div className="mt-3 overflow-x-auto text-sm leading-7"><MathText>{material.questionLatex}</MathText></div>
                      {material.answerType === "multiple_choice" && <div className="mt-3 grid gap-2 sm:grid-cols-2">{material.choices.map((choice) => <div key={choice.label} className={`rounded-lg border px-3 py-2 text-sm ${choice.label === material.answerKey ? "border-emerald-300 bg-emerald-50" : "bg-slate-50"}`}><span className="mr-2 font-bold">{choice.label}.</span><MathText>{choice.text}</MathText></div>)}</div>}
                      {material.answerType !== "multiple_choice" && <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{material.answerType === "numeric" ? "Зөв хариу:" : "Жишиг хариу:"}</span> {material.answerKey}</p>}
                    </div>
                    {canEdit && <div className="flex shrink-0 gap-2"><Button size="sm" variant="secondary" onClick={() => beginEdit(material)}><Edit3 size={14}/>Засах</Button><Button size="sm" variant="ghost" className="text-red-700" disabled={pending} onClick={() => remove(material)} aria-label={`${material.title} материалыг устгах`}><Trash2 size={15}/></Button></div>}
                  </div>
                </article>
              );
            })}
          </div>
        ) : <div className="px-6 py-14 text-center"><BookOpen className="mx-auto text-muted-foreground"/><h3 className="mt-4 font-semibold">Материал олдсонгүй</h3><p className="mt-2 text-sm text-muted-foreground">Шүүлтүүрээ өөрчлөх эсвэл шинэ материал нэмнэ үү.</p></div>}
      </section>
    </div>
  );
}

function MaterialEditor({ draft, pending, onChange, onCancel, onSave }: { draft: LibraryMaterialInput; pending: boolean; onChange: (draft: LibraryMaterialInput) => void; onCancel: () => void; onSave: () => void }) {
  function changeType(answerType: SchoolLibraryAnswerType) {
    onChange({
      ...draft,
      answerType,
      answerKey: answerType === "multiple_choice" ? "A" : "",
      choices: answerType === "multiple_choice" ? ["A", "B", "C", "D"].map((label) => ({ label, text: "" })) : [],
    });
  }

  function setChoice(index: number, text: string) {
    onChange({ ...draft, choices: draft.choices.map((choice, current) => current === index ? { ...choice, text } : choice) });
  }

  function addChoice() {
    if (draft.choices.length >= 8) return;
    const label = String.fromCharCode(65 + draft.choices.length);
    onChange({ ...draft, choices: [...draft.choices, { label, text: "" }] });
  }

  function removeChoice(index: number) {
    if (draft.choices.length <= 2) return;
    const choices = draft.choices.filter((_, current) => current !== index).map((choice, current) => ({ ...choice, label: String.fromCharCode(65 + current) }));
    onChange({ ...draft, choices, answerKey: "A" });
  }

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div><p className="text-xs font-semibold tracking-[.12em] text-primary">МАТЕРИАЛЫН EDITOR</p><h2 className="mt-1 text-lg font-semibold">{draft.id ? "Материал засах" : "Шинэ материал нэмэх"}</h2></div>
        <button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted" aria-label="Editor хаах"><X size={18}/></button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Гарчиг"><input value={draft.title} maxLength={160} onChange={(event) => onChange({ ...draft, title: event.target.value })} className="h-11 rounded-xl border px-3" placeholder="Квадрат тэгшитгэл — 01"/></Field>
        <Field label="Сэдэв / tag"><input value={draft.topic} maxLength={80} onChange={(event) => onChange({ ...draft, topic: event.target.value })} className="h-11 rounded-xl border px-3" placeholder="Алгебр"/></Field>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Field label="Асуулт (LaTeX: $...$ эсвэл $$...$$)"><textarea value={draft.questionLatex} maxLength={12000} onChange={(event) => onChange({ ...draft, questionLatex: event.target.value })} rows={8} className="rounded-xl border p-3 font-mono text-sm" placeholder="Хэрэв $x^2-5x+6=0$ бол $x$-ийн утгыг ол."/></Field>
        <div className="min-h-52 rounded-xl border bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KaTeX preview</p><div className="mt-4 overflow-x-auto text-base leading-8">{draft.questionLatex ? <MathText>{draft.questionLatex}</MathText> : <p className="text-sm text-muted-foreground">Асуултаа бичихэд энд шууд харагдана.</p>}</div></div>
      </div>
      <div className="mt-4 max-w-sm"><Field label="Хариултын төрөл"><select value={draft.answerType} onChange={(event) => changeType(event.target.value as SchoolLibraryAnswerType)} className="h-11 rounded-xl border bg-white px-3"><option value="multiple_choice">Сонголттой</option><option value="numeric">Тоон хариу</option><option value="free_response">Задгай хариулт</option></select></Field></div>

      {draft.answerType === "multiple_choice" ? (
        <div className="mt-5">
          <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Хариултын сонголтууд</h3><p className="mt-1 text-xs text-muted-foreground">Зөв хариултын зүүн талын тэмдэглэгээг сонгоно уу.</p></div><Button size="sm" variant="secondary" onClick={addChoice} disabled={draft.choices.length >= 8}><Plus size={14}/>Сонголт</Button></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {draft.choices.map((choice, index) => <div key={`${choice.label}-${index}`} className={`rounded-xl border p-3 ${draft.answerKey === choice.label ? "border-emerald-300 bg-emerald-50/60" : ""}`}><div className="flex items-center gap-2"><label className="flex shrink-0 items-center gap-2 text-sm font-semibold"><input type="radio" name="library-correct-choice" checked={draft.answerKey === choice.label} onChange={() => onChange({ ...draft, answerKey: choice.label })}/>{choice.label}.</label><input value={choice.text} onChange={(event) => setChoice(index, event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border bg-white px-3 font-mono text-sm" placeholder="Сонголтын текст / LaTeX"/><button type="button" disabled={draft.choices.length <= 2} onClick={() => removeChoice(index)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-30" aria-label={`${choice.label} сонголт устгах`}><Trash2 size={15}/></button></div>{choice.text && <div className="mt-2 overflow-x-auto rounded-lg bg-white px-3 py-2 text-sm"><MathText>{choice.text}</MathText></div>}</div>)}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label={draft.answerType === "numeric" ? "Зөв тоон хариу" : "Жишиг хариу / үнэлгээний заавар"}><textarea value={draft.answerKey} maxLength={2000} onChange={(event) => onChange({ ...draft, answerKey: event.target.value })} rows={4} className="rounded-xl border p-3" placeholder={draft.answerType === "numeric" ? "Жишээ: 12.5" : "Багшийн шалгах жишиг хариу"}/></Field>
          <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Хариултын preview</p><div className="mt-3 text-sm leading-7">{draft.answerKey ? <MathText>{draft.answerKey}</MathText> : <span className="text-muted-foreground">Хариугаа оруулна уу.</span>}</div></div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t pt-5"><Button variant="secondary" onClick={onCancel}>Болих</Button><Button onClick={onSave} loading={pending}><Check size={16}/>{draft.id ? "Өөрчлөлт хадгалах" : "Санд нэмэх"}</Button></div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>; }
