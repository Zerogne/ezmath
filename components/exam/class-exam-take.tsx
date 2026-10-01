"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Bookmark, ChevronLeft, ChevronRight, Clock3, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { submitClassExam } from "@/app/class-exam-actions";
import { MathText } from "@/components/math/math-text";
import { formatScore } from "@/lib/class-exams/format";
import { MAX_CLASS_EXAM_ACTION_BYTES, serializedClassExamBytes } from "@/lib/class-exams/types";
import type { ClassExamQuestion } from "@/lib/data/class-exams";

type StudentAnswers = Record<string, { selectedChoice?: string; responseText?: string }>;

export function ClassExamTake({ exam, submission }: { exam: { id: string; title: string; classroomName: string; durationMinutes: number; closesAt: string | null; questions: ClassExamQuestion[] }; submission: { id: string; startedAt: string } }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [restored, setRestored] = useState(false);
  const deadline = Math.min(new Date(submission.startedAt).getTime() + exam.durationMinutes * 60_000, exam.closesAt ? new Date(exam.closesAt).getTime() : Number.POSITIVE_INFINITY);
  const [remaining, setRemaining] = useState(() => secondsUntil(deadline));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submittedRef = useRef(false);
  const question = exam.questions[index];
  const storageKey = `ezmath:class-exam:${submission.id}`;

  const submit = useCallback((confirmSubmission: boolean) => {
    if (submittedRef.current) return;
    if (confirmSubmission && !window.confirm("Шалгалтаа илгээх үү? Дараа нь засах боломжгүй.")) return;
    const payload = Object.entries(answers).map(([questionId, answer]) => ({ questionId, ...answer }));
    if (serializedClassExamBytes(payload) > MAX_CLASS_EXAM_ACTION_BYTES) {
      setError("Агуулга хэт том байна. Текстээ богиносгоно уу.");
      return;
    }
    submittedRef.current = true;
    setError(null);
    startTransition(async () => {
      const result = await submitClassExam(exam.id, payload);
      if (result.error) {
        submittedRef.current = false;
        setError(result.error);
        return;
      }
      removeStoredAnswers(storageKey);
      router.replace(`/dashboard/exams/${exam.id}/result`);
    });
  }, [answers, exam.id, router, storageKey]);

  const finish = useCallback(() => submit(true), [submit]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextRemaining = secondsUntil(deadline);
      setRemaining(nextRemaining);
      if (restored && nextRemaining === 0) submit(false);
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [deadline, restored, submit]);
  useEffect(() => {
    const stored = readStoredAnswers(storageKey, exam.questions);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(stored);
    setRestored(true);
  }, [exam.questions, storageKey]);
  useEffect(() => {
    if (!restored) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(answers)); } catch { /* Storage can be unavailable or full. */ }
  }, [answers, restored, storageKey]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (!submittedRef.current) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, []);

  if (!question) return <div className="grid min-h-screen place-items-center">Асуулт олдсонгүй.</div>;
  const answer = answers[question.id] ?? {};
  const answered = exam.questions.filter((item) => { const value = answers[item.id]; return item.answerType === "multiple_choice" ? Boolean(value?.selectedChoice) : Boolean(value?.responseText?.trim()); }).length;
  return <div className="flex min-h-dvh flex-col bg-slate-50"><header className="sticky top-0 z-20 border-b bg-white"><div className="flex min-h-16 items-center gap-4 px-4 sm:px-6"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{exam.title}</p><p className="text-xs text-muted-foreground">{exam.classroomName}</p></div><span className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-sm font-semibold ${remaining < 300 ? "bg-red-50 text-red-700" : "bg-muted"}`}><Clock3 size={16}/>{formatTime(remaining)}</span><button type="button" onClick={finish} disabled={pending || !restored} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60"><Send size={15}/><span className="hidden sm:inline">Илгээх</span></button></div><div className="h-1 bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${((index + 1) / exam.questions.length) * 100}%` }}/></div></header>
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]"><section className="rounded-2xl border bg-white p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-muted-foreground">Асуулт {index + 1} / {exam.questions.length}</p><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{question.topic} · {formatScore(question.maxPoints)} оноо</span></div><h1 className="mt-7 overflow-x-auto text-lg font-semibold leading-8 sm:text-xl"><MathText>{question.questionLatex}</MathText></h1>
      {question.answerType === "multiple_choice" ? <div role="radiogroup" className="mt-7 grid gap-3">{question.choices.map((choice) => <button key={choice.label} type="button" role="radio" aria-checked={answer.selectedChoice === choice.label} onClick={() => setAnswers((current) => ({ ...current, [question.id]: { selectedChoice: choice.label } }))} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${answer.selectedChoice === choice.label ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/30"}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold ${answer.selectedChoice === choice.label ? "bg-primary text-white" : "bg-muted"}`}>{choice.label}</span><span className="min-w-0 pt-0.5 text-sm leading-6"><MathText>{choice.text}</MathText></span></button>)}</div> : question.answerType === "numeric" ? <label className="mt-7 grid gap-2 text-sm font-semibold"><span>Тоон хариу</span><input inputMode="decimal" value={answer.responseText ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { responseText: event.target.value } }))} className="h-12 rounded-xl border px-4 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Хариугаа оруулна уу"/></label> : <label className="mt-7 grid gap-2 text-sm font-semibold"><span>Дэлгэрэнгүй хариу</span><textarea value={answer.responseText ?? ""} maxLength={12_000} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: { responseText: event.target.value } }))} rows={9} className="rounded-xl border p-4 text-base leading-7 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Бодолт, тайлбараа энд бичнэ үү..."/></label>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 flex items-center justify-between border-t pt-5"><button type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)} className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-30"><ChevronLeft size={16}/>Өмнөх</button><button type="button" disabled={index === exam.questions.length - 1} onClick={() => setIndex((value) => value + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-30">Дараах<ChevronRight size={16}/></button></div></section>
      <aside className="h-fit rounded-2xl border bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Асуултууд</h2><span className="text-xs text-muted-foreground">{answered}/{exam.questions.length}</span></div><div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">{exam.questions.map((item, current) => { const value = answers[item.id]; const hasAnswer = item.answerType === "multiple_choice" ? Boolean(value?.selectedChoice) : Boolean(value?.responseText?.trim()); return <button key={item.id} type="button" onClick={() => setIndex(current)} aria-label={`${current + 1}-р асуулт`} className={`grid aspect-square place-items-center rounded-lg text-xs font-semibold ${current === index ? "bg-primary text-white" : hasAnswer ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{current + 1}</button>; })}</div><p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Bookmark size={14}/>Илгээх хүртэл энд хадгалагдана.</p></aside></main>
  </div>;
}

function formatTime(seconds: number) { const minutes = Math.floor(seconds / 60); const rest = seconds % 60; return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`; }
function secondsUntil(deadline: number) { return Math.max(0, Math.floor((deadline - Date.now()) / 1_000)); }
function removeStoredAnswers(key: string) { try { window.localStorage.removeItem(key); } catch { /* Storage can be unavailable. */ } }
function readStoredAnswers(key: string, questions: ClassExamQuestion[]): StudentAnswers {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const questionMap = new Map(questions.map((item) => [item.id, item]));
    const restored: StudentAnswers = {};
    for (const [questionId, raw] of Object.entries(value as Record<string, unknown>)) {
      const current = questionMap.get(questionId);
      if (!current || !raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const answer = raw as { selectedChoice?: unknown; responseText?: unknown };
      if (current.answerType === "multiple_choice") {
        const selectedChoice = typeof answer.selectedChoice === "string" && current.choices.some((choice) => choice.label === answer.selectedChoice) ? answer.selectedChoice : undefined;
        if (selectedChoice) restored[questionId] = { selectedChoice };
        continue;
      }
      const responseText = typeof answer.responseText === "string" ? answer.responseText.slice(0, 12_000) : "";
      if (responseText) restored[questionId] = { responseText };
    }
    return restored;
  } catch {
    return {};
  }
}
