"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { QuestionView } from "@/components/exam/question-view";
import { MathText } from "@/components/math/math-text";
import { Ezi } from "@/components/home/redesign/illustrations";
import { checkBankAnswer, setBankMark, type BankCheckResult } from "@/app/question-bank/actions";
import type { Difficulty, StudentQuestion } from "@/types/exam";

type Item = { question: StudentQuestion; group: string; groupLabel: string; difficulty: Difficulty | null; marked: boolean };
type Checked = Exclude<BankCheckResult, { error: string }>;
const DIFFICULTY_LABEL: Record<Difficulty, string> = { Easy: "Хялбар", Medium: "Дунд", Hard: "Хүнд" };

/** One question at a time: answer, check against the server, read the solution, move on; a summary closes the set. */
export function PracticeSession({ items }: { items: Item[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [written, setWritten] = useState<Record<string, Record<string, string>>>({});
  const [results, setResults] = useState<Record<string, Checked>>({});
  const [marked, setMarked] = useState(() => new Set(items.filter((item) => item.marked).map((item) => item.question.id)));
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [checking, setChecking] = useState(false);
  const [restarting, startRestart] = useTransition();
  const item = items[index];
  const question = item.question;
  const result = results[question.id];
  const isWritten = question.questionType === "multi-blank";
  const hasAnswer = isWritten ? Object.values(written[question.id] ?? {}).some((value) => value.trim()) : Boolean(choices[question.id]);
  const correctCount = Object.values(results).filter((value) => value.state === "correct").length;

  // Plain state, not a transition: React entangles pending transitions, so saving a mark would also show "checking".
  async function check() {
    setError(null);
    setChecking(true);
    try {
      const response = await checkBankAnswer({ questionId: question.id, selectedChoiceId: choices[question.id], responses: written[question.id] });
      if ("error" in response) setError(response.error);
      else setResults((current) => ({ ...current, [question.id]: response }));
    } catch {
      setError("Шалгаж чадсангүй. Дахин оролдоно уу.");
    } finally {
      setChecking(false);
    }
  }

  function toggleMark() {
    const next = !marked.has(question.id);
    setMarked((current) => { const copy = new Set(current); if (next) copy.add(question.id); else copy.delete(question.id); return copy; });
    void setBankMark(question.id, next);
  }

  function go(to: number) { setError(null); setIndex(to); }

  if (finished) {
    const total = items.length;
    const accuracy = total ? Math.round(correctCount / total * 100) : 0;
    return <section className="rounded-[28px] border-2 border-[#EEF0F6] bg-white p-6 text-center sm:p-10">
      <Ezi pose={accuracy >= 80 ? "trophy" : accuracy >= 50 ? "happy" : "read"} size={130} className="mx-auto block"/>
      <p className="eyebrow mt-2">Багц дууслаа</p>
      <h1 className="mt-3 text-5xl font-medium">{correctCount} / {total}</h1>
      <p className="mt-2 text-[#5B6275]">{accuracy}% зөв · Хариулаагүй: {total - Object.keys(results).length}</p>
      <ol className="mx-auto mt-8 grid max-w-xl gap-2 text-left">{items.map((entry, position) => {
        const state = results[entry.question.id]?.state;
        return <li key={entry.question.id}><button type="button" onClick={() => { setFinished(false); go(position); }} className="flex w-full items-center gap-3 rounded-xl bg-[#F7F8FC] px-4 py-3 text-left text-sm hover:bg-[#EEF1FF]">
          {state === "correct" ? <CheckCircle2 size={18} className="shrink-0 text-[#16A34A]"/> : state === "incorrect" ? <XCircle size={18} className="shrink-0 text-red-600"/> : <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#C9CDDA]"/>}
          <span className="font-semibold">{position + 1}.</span><span className="min-w-0 flex-1 truncate">{entry.groupLabel}</span>{entry.difficulty && <span className="text-xs text-[#9AA0B4]">{DIFFICULTY_LABEL[entry.difficulty]}</span>}
        </button></li>;
      })}</ol>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={() => startRestart(() => router.refresh())} disabled={restarting} className="btn-dark"><RotateCcw size={17}/>{restarting ? "Ачаалж байна…" : "Шинэ багц"}</button>
        <Link href="/tests?exam=SAT#bank" className="btn-outline">Бодлогын сан руу</Link>
      </div>
    </section>;
  }

  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/tests?exam=SAT#bank" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6275] hover:text-[#0B1030]"><ArrowLeft size={16}/>Бодлогын сан</Link>
      <p className="text-sm text-[#5B6275]">{correctCount} зөв · {Object.keys(results).length} / {items.length} шалгасан</p>
    </div>
    <nav aria-label="Асуултууд" className="mt-4 flex flex-wrap gap-1.5">{items.map((entry, position) => {
      const state = results[entry.question.id]?.state;
      const tone = state === "correct" ? "bg-[#DCFCE7] text-[#16A34A]" : state === "incorrect" ? "bg-red-50 text-red-600" : "bg-[#F1F3F8] text-[#5B6275]";
      return <button key={entry.question.id} type="button" onClick={() => go(position)} aria-current={position === index ? "step" : undefined} className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${tone} ${position === index ? "ring-2 ring-[#2B4BE8] ring-offset-2" : ""}`}>{position + 1}</button>;
    })}</nav>
    <div className="mt-6 rounded-[28px] border-2 border-[#EEF0F6] bg-white p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-md bg-[#E8EEFF] px-[7px] py-[3px] text-[#2B4BE8]">{item.groupLabel}</span>
        {item.difficulty && <span className="rounded-md bg-[#F1F3F8] px-[7px] py-[3px] text-[#5B6275]">{DIFFICULTY_LABEL[item.difficulty]}</span>}
      </div>
      <QuestionView question={{ ...question, topic: undefined }} examType="SAT" total={items.length} answer={choices[question.id]} writtenAnswers={written[question.id]} marked={marked.has(question.id)}
        onAnswer={(choiceId) => { if (!result) setChoices((current) => ({ ...current, [question.id]: choiceId })); }}
        onWrite={(fieldId, value) => { if (!result) setWritten((current) => ({ ...current, [question.id]: { ...current[question.id], [fieldId]: value } })); }}
        onMark={toggleMark}/>
      {result && <Feedback result={result} question={question}/>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 flex items-center justify-between gap-3 border-t-2 border-[#F0F1F6] pt-5">
        <button type="button" disabled={index === 0} onClick={() => go(index - 1)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[#5B6275] hover:text-[#0B1030] disabled:opacity-40"><ArrowLeft size={16}/>Өмнөх</button>
        {!result ? <button type="button" disabled={!hasAnswer || checking} onClick={() => void check()} className="btn-dark h-12 text-base disabled:pointer-events-none disabled:opacity-50">{checking ? "Шалгаж байна…" : "Шалгах"}</button>
          : index < items.length - 1 ? <button type="button" onClick={() => go(index + 1)} className="btn-dark h-12 text-base">Дараагийн асуулт<ArrowRight size={17}/></button>
          : <button type="button" onClick={() => setFinished(true)} className="btn-dark h-12 text-base">Дүн харах<ArrowRight size={17}/></button>}
      </div>
    </div>
  </div>;
}

function Feedback({ result, question }: { result: Checked; question: StudentQuestion }) {
  const correct = result.state === "correct";
  const choice = question.choices.find((item) => item.id === result.correctChoiceId);
  return <div className={`mt-6 rounded-[18px] border-2 p-5 ${correct ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-red-100 bg-red-50/60"}`} role="status">
    <p className={`flex items-center gap-2 font-semibold ${correct ? "text-[#16A34A]" : "text-red-700"}`}>{correct ? <CheckCircle2 size={19}/> : <XCircle size={19}/>}{correct ? "Зөв!" : "Буруу"}</p>
    {choice && <div className="mt-3 text-sm"><span className="font-semibold">Зөв хариулт: {choice.label}.</span> <MathText>{choice.text}</MathText>{choice.imageUrl && <span className="relative mt-2 block h-28 w-44 overflow-hidden rounded-lg border bg-white"><Image src={choice.imageUrl} alt={`${choice.label} хариултын зураг`} fill unoptimized className="object-contain"/></span>}</div>}
    {result.acceptedAnswers.map((field) => <p key={field.label} className="mt-3 text-sm"><span className="font-semibold">Зөв хариулт{result.acceptedAnswers.length > 1 ? ` (${field.label})` : ""}:</span> {field.answers.join("  ·  ")}</p>)}
    {result.explanation && <div className="mt-4 border-t border-black/5 pt-4 text-sm leading-6"><p className="font-semibold">Тайлбар</p><div className="mt-1 whitespace-pre-line"><MathText>{result.explanation}</MathText></div></div>}
  </div>;
}
