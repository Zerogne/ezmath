"use client";

import { Plus, Trash2 } from "lucide-react";
import { MathText } from "@/components/math/math-text";
import { Button } from "@/components/ui/button";
import type { LibraryChoice } from "@/lib/data/school-library";
import type { SchoolLibraryAnswerType } from "@/lib/supabase/database.types";

export type ProblemDraft = { questionLatex: string; answerType: SchoolLibraryAnswerType; answerKey: string; choices: LibraryChoice[] };

export const answerTypeLabels: Record<SchoolLibraryAnswerType, string> = {
  multiple_choice: "Сонголттой",
  numeric: "Тоон хариу",
  free_response: "Задгай хариулт",
};

export function blankChoices(count = 4): LibraryChoice[] {
  return Array.from({ length: count }, (_, index) => ({ label: String.fromCharCode(65 + index), text: "" }));
}

/** Question text with live KaTeX preview, answer type, and choices / answer key. `idPrefix` keeps radio groups separate when several editors are on one page. */
export function ProblemFields<T extends ProblemDraft>({ draft, onChange, idPrefix, disabled = false }: { draft: T; onChange: (draft: T) => void; idPrefix: string; disabled?: boolean }) {
  function changeType(answerType: SchoolLibraryAnswerType) {
    onChange({ ...draft, answerType, answerKey: answerType === "multiple_choice" ? "A" : "", choices: answerType === "multiple_choice" ? blankChoices() : [] });
  }
  function setChoice(index: number, text: string) {
    onChange({ ...draft, choices: draft.choices.map((choice, current) => current === index ? { ...choice, text } : choice) });
  }
  function addChoice() {
    if (draft.choices.length >= 8) return;
    onChange({ ...draft, choices: [...draft.choices, { label: String.fromCharCode(65 + draft.choices.length), text: "" }] });
  }
  function removeChoice(index: number) {
    if (draft.choices.length <= 2) return;
    const choices = draft.choices.filter((_, current) => current !== index).map((choice, current) => ({ ...choice, label: String.fromCharCode(65 + current) }));
    onChange({ ...draft, choices, answerKey: "A" });
  }

  return <fieldset disabled={disabled} className="min-w-0 space-y-4">
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label="Асуулт (LaTeX: $...$ эсвэл $$...$$)"><textarea value={draft.questionLatex} maxLength={12000} onChange={(event) => onChange({ ...draft, questionLatex: event.target.value })} rows={6} className="rounded-xl border p-3 font-mono text-sm" placeholder="Хэрэв $x^2-5x+6=0$ бол $x$-ийн утгыг ол."/></Field>
      <div className="min-h-40 rounded-xl border bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">KaTeX preview</p><div className="mt-3 overflow-x-auto text-base leading-8">{draft.questionLatex ? <MathText>{draft.questionLatex}</MathText> : <p className="text-sm text-muted-foreground">Асуултаа бичихэд энд шууд харагдана.</p>}</div></div>
    </div>
    <div className="max-w-sm"><Field label="Хариултын төрөл"><select value={draft.answerType} onChange={(event) => changeType(event.target.value as SchoolLibraryAnswerType)} className="h-11 rounded-xl border bg-white px-3">{Object.entries(answerTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field></div>
    {draft.answerType === "multiple_choice" ? <div>
      <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold">Хариултын сонголтууд</h3><p className="mt-1 text-xs text-muted-foreground">Зөв хариултыг тэмдэглэнэ үү.</p></div>{!disabled && <Button size="sm" variant="secondary" onClick={addChoice} disabled={draft.choices.length >= 8}><Plus size={14}/>Сонголт</Button>}</div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {draft.choices.map((choice, index) => <div key={`${choice.label}-${index}`} className={`rounded-xl border p-3 ${draft.answerKey === choice.label ? "border-emerald-300 bg-emerald-50/60" : ""}`}>
          <div className="flex items-center gap-2">
            <label className="flex shrink-0 items-center gap-2 text-sm font-semibold"><input type="radio" name={`${idPrefix}-correct`} checked={draft.answerKey === choice.label} onChange={() => onChange({ ...draft, answerKey: choice.label })}/>{choice.label}.</label>
            <input value={choice.text} onChange={(event) => setChoice(index, event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border bg-white px-3 font-mono text-sm" placeholder="Сонголтын текст / LaTeX" aria-label={`${choice.label} сонголт`}/>
            {!disabled && <button type="button" disabled={draft.choices.length <= 2} onClick={() => removeChoice(index)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-30" aria-label={`${choice.label} сонголт устгах`}><Trash2 size={15}/></button>}
          </div>
          {choice.text && <div className="mt-2 overflow-x-auto rounded-lg bg-white px-3 py-2 text-sm"><MathText>{choice.text}</MathText></div>}
        </div>)}
      </div>
    </div> : <div className="grid gap-4 lg:grid-cols-2">
      <Field label={draft.answerType === "numeric" ? "Зөв тоон хариу" : "Жишиг хариу / үнэлгээний заавар"}><textarea value={draft.answerKey} maxLength={2000} onChange={(event) => onChange({ ...draft, answerKey: event.target.value })} rows={3} className="rounded-xl border p-3" placeholder={draft.answerType === "numeric" ? "Жишээ: 12.5 (олон зөв утгыг | тэмдэгтээр салгана)" : "Багшийн шалгах жишиг хариу"}/></Field>
      <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Хариултын preview</p><div className="mt-3 text-sm leading-7">{draft.answerKey ? <MathText>{draft.answerKey}</MathText> : <span className="text-muted-foreground">Хариугаа оруулна уу.</span>}</div></div>
    </div>}
  </fieldset>;
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-1.5 text-sm font-medium ${className}`}>{label}{children}</label>;
}
