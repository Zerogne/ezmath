"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, FileCode2, FileUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MathText } from "@/components/math/math-text";
import type { MaterialQuestion } from "@/lib/admin/material-types";
import type { ExamType } from "@/types/exam";
import { latexImportExample, parseLatexQuestions, type ParsedLatexQuestion } from "@/lib/admin/latex-import";

export function LatexImportPanel({ examType, onImport, defaultOpen = false }: { examType: ExamType; onImport: (questions: MaterialQuestion[]) => void; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [source, setSource] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const deferredSource = useDeferredValue(source);
  const result = useMemo(() => parseLatexQuestions(deferredSource, examType), [deferredSource, examType]);
  const errorCount = result.questions.filter((item) => item.issues.some((issue) => issue.level === "error")).length;
  const warningCount = result.questions.filter((item) => item.issues.length && item.issues.every((issue) => issue.level === "warning")).length;
  const readyCount = result.questions.length - errorCount - warningCount;
  const importable = result.questions.filter((item) => item.question.text.trim());

  async function loadFile(file: File | undefined) {
    if (!file) return;
    setSource(await file.text());
    setNotice(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function importQuestions() {
    onImport(importable.map((item) => item.question));
    setNotice(`${importable.length} асуулт нэмэгдлээ.${errorCount ? ` ${errorCount} асуултын алдааг editor дотор засна уу.` : ""}`);
    setSource("");
  }

  return <Card>
    <CardHeader className="flex flex-row items-start gap-3 space-y-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted"><FileCode2 size={18} /></span>
      <div className="min-w-0 flex-1"><CardTitle>LaTeX-ээр асуулт оруулах</CardTitle><p className="mt-1 text-xs leading-5 text-muted-foreground">LaTeX <span className="font-mono">exam</span> class-ийн форматаар олон асуултыг нэг дор бичих эсвэл paste хийнэ.</p></div>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Хаах" : "Нээх"}<ChevronDown size={15} className={`transition ${open ? "rotate-180" : ""}`} /></Button>
    </CardHeader>
    {open && <CardContent className="space-y-4">
      <details className="rounded-xl border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">Формат</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Асуулт бүр <code className="font-mono">\question</code>-оор эхэлнэ. Математикийг <code className="font-mono">$...$</code> эсвэл <code className="font-mono">$$...$$</code> дотор бичнэ.</li>
          <li>Сонголт: <code className="font-mono">\begin{"{choices}"}</code> дотор <code className="font-mono">\choice</code>, зөв хариулт нь <code className="font-mono">\CorrectChoice</code>. A, B, C… дарааллаар ({examType === "SAT" ? "SAT: 4" : "ЭЕШ: 5"} хүртэл).</li>
          {examType === "SAT" ? <li>Бичих хариулт (grid-in): <code className="font-mono">\answer{"{3/4}"}</code>. Тэнцүү бутархай/аравтыг (<code className="font-mono">.75</code>, <code className="font-mono">0.75</code>, <code className="font-mono">6/8</code>) болон SAT-ийн дүрмээр тайрсан/бөөрөнхийлсөн аравтыг автоматаар зөвд тооцно.</li>
            : <li>Бичих хариулт: <code className="font-mono">\answer{"{9}"}</code>, хэд хэдэн зөв хувилбар <code className="font-mono">\answer{"{0,75|3/4}"}</code>, ЭЕШ II талбар <code className="font-mono">\answer[ab]{"{12}"}</code>.</li>}
          <li>Нэмэлт: <code className="font-mono">\topic{"{...}"}</code>, <code className="font-mono">\difficulty{"{Easy|Medium|Hard}"}</code>, <code className="font-mono">\explanation{"{...}"}</code> эсвэл <code className="font-mono">solution</code> орчин.</li>
          <li>Тусдаа түлхүүр: <code className="font-mono">\answers{"{1-B, 2-D, 3-0,75|3/4}"}</code>. Бүтэн <code className="font-mono">.tex</code> файлыг ч шууд оруулж болно.</li>
        </ul>
      </details>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => { setSource(latexImportExample); setNotice(null); }}>Жишээ</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => fileInput.current?.click()}><FileUp size={15} />.tex файл</Button>
            {source && <Button type="button" size="sm" variant="ghost" onClick={() => setSource("")}>Цэвэрлэх</Button>}
            <input ref={fileInput} type="file" accept=".tex,.txt,text/plain,application/x-tex" className="hidden" onChange={(event) => void loadFile(event.target.files?.[0])} />
          </div>
          <Textarea value={source} onChange={(event) => { setSource(event.target.value); setNotice(null); }} rows={22} spellCheck={false} placeholder={"\\question ...\n\\begin{choices}\n  \\choice ...\n  \\CorrectChoice ...\n\\end{choices}"} className="min-h-[420px] font-mono text-xs leading-5" aria-label="LaTeX эх" />
        </div>
        <div className="grid content-start gap-2">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">{result.questions.length ? <>{result.questions.length} асуулт · <span className="text-emerald-700">{readyCount} бэлэн</span>{warningCount > 0 && <> · <span className="text-amber-700">{warningCount} анхааруулгатай</span></>}{errorCount > 0 && <> · <span className="text-red-700">{errorCount} алдаатай</span></>}</> : "Урьдчилан харах"}</p>
          <div className="max-h-[460px] min-h-[420px] space-y-2 overflow-y-auto rounded-xl border bg-muted/20 p-2">
            {result.issues.map((issue, index) => <IssueLine key={index} level={issue.level} message={issue.message} />)}
            {!result.questions.length && !result.issues.length && <p className="p-6 text-center text-xs text-muted-foreground">LaTeX бичихэд асуултууд энд харагдана.</p>}
            {result.questions.map((item) => <PreviewItem key={item.number} item={item} />)}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={!importable.length} onClick={importQuestions}>{importable.length ? `${importable.length} асуулт нэмэх` : "Асуулт нэмэх"}</Button>
        {errorCount > 0 && <p className="text-xs text-amber-700">{errorCount} асуулт алдаатай — нэмсний дараа editor дотор засах эсвэл энд засаад нэмнэ үү.</p>}
        {notice && <p role="status" className="text-xs font-medium text-primary">{notice}</p>}
      </div>
    </CardContent>}
  </Card>;
}

function PreviewItem({ item }: { item: ParsedLatexQuestion }) {
  const { question, issues } = item;
  const hasError = issues.some((issue) => issue.level === "error");
  const Icon = hasError ? XCircle : issues.length ? AlertTriangle : CheckCircle2;
  return <article className={`rounded-lg border bg-card p-3 text-sm ${hasError ? "border-red-200" : issues.length ? "border-amber-200" : ""}`}>
    <div className="flex items-start gap-2">
      <Icon size={16} className={`mt-0.5 shrink-0 ${hasError ? "text-red-600" : issues.length ? "text-amber-600" : "text-emerald-600"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground">№{item.number}{question.topic && ` · ${question.topic}`} · {question.difficulty}</p>
        <div className="mt-1 overflow-x-auto whitespace-pre-line leading-7"><MathText>{question.text || "—"}</MathText></div>
        {question.questionType === "multiple-choice" ? <ul className="mt-2 grid gap-1">{question.choices.map((choice) => <li key={choice.id} className={`flex gap-2 rounded-md px-2 py-1 ${choice.label === question.correctAnswer ? "bg-emerald-50 font-medium text-emerald-900" : ""}`}><span className="font-semibold">{choice.label}.</span><span className="min-w-0 overflow-x-auto"><MathText>{choice.text}</MathText></span></li>)}</ul>
          : <ul className="mt-2 grid gap-1">{question.responseFields.map((field) => <li key={field.id} className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-900"><span className="font-semibold">{field.label}:</span> {field.acceptedAnswers.join("  |  ") || "—"}</li>)}</ul>}
        {question.explanation && <p className="mt-2 text-xs text-muted-foreground"><span className="font-semibold">Тайлбар:</span> <MathText>{question.explanation}</MathText></p>}
        {issues.length > 0 && <div className="mt-2 space-y-1">{issues.map((issue, index) => <IssueLine key={index} level={issue.level} message={issue.message} />)}</div>}
      </div>
    </div>
  </article>;
}

function IssueLine({ level, message }: { level: "error" | "warning"; message: string }) {
  return <p className={`rounded-md px-2 py-1 text-xs ${level === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{message}</p>;
}
