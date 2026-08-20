"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Target, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { loadCompletedAttempt } from "@/lib/exam/session-storage";
import type { CompletedAttempt, StudentQuestion, Test } from "@/types/exam";

export function TestReport({ test, questions }: { test: Test; questions: StudentQuestion[] }) {
  const [attempt, setAttempt] = useState<CompletedAttempt | null | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempt(loadCompletedAttempt(test.id));
  }, [test.id]);
  if (attempt === undefined) return <div className="h-80 animate-pulse rounded-2xl bg-muted"/>;
  if (!attempt) return <div className="rounded-2xl border bg-white p-10 text-center"><h1 className="text-xl font-bold">Тайлан олдсонгүй</h1><p className="mt-2 text-sm text-muted-foreground">Энэ шалгалтыг дуусгасны дараа дэлгэрэнгүй тайлан үүснэ.</p><ButtonLink href={`/tests/${test.id}`} className="mt-6">Шалгалт руу очих</ButtonLink></div>;
  const result = attempt.result;
  return <>
    <Link href={`/tests/${test.id}/result`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Үр дүн рүү буцах</Link>
    <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Badge tone={test.examType === "SAT" ? "blue" : "green"}>{test.examType === "EYESH" ? "ЭЕШ" : "SAT"}</Badge><h1 className="mt-4 text-3xl font-bold">Гүйцэтгэлийн тайлан</h1><p className="mt-2 text-muted-foreground">{test.title}</p></div><ButtonLink href={`/tests/${test.id}`}>Дахин шалгалт өгөх</ButtonLink></div>
    <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"><Stat icon={Target} label="Нарийвчлал" value={`${result.accuracy}%`}/><Stat icon={CheckCircle2} label="Зөв" value={`${result.correct}`}/><Stat icon={XCircle} label="Буруу / хоосон" value={`${result.incorrect + result.unanswered}`}/><Stat icon={Clock3} label="Зарцуулсан" value={`${Math.floor(result.durationSeconds / 60)}:${String(result.durationSeconds % 60).padStart(2,"0")}`}/></section>
    <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-2xl border bg-white p-6"><h2 className="text-lg font-bold">Сэдвийн гүйцэтгэл</h2><div className="mt-6 space-y-6">{result.topicBreakdown.map((topic) => <div key={topic.topic}><div className="flex justify-between gap-3 text-sm"><span className="font-medium">{topic.topic}</span><span className="text-muted-foreground">{topic.accuracy}%</span></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${topic.accuracy}%` }}/></div></div>)}</div></section>
      <section className="rounded-2xl border bg-white p-6"><div className="flex justify-between"><h2 className="text-lg font-bold">Асуултын тойм</h2><span className="text-xs text-muted-foreground">{questions.length} асуулт</span></div><div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8">{questions.map((question) => { const state = result.answerResults[question.id] ?? "unanswered"; return <div key={question.id} title={state === "correct" ? "Зөв" : state === "incorrect" ? "Буруу" : "Хариулаагүй"} className={`grid h-10 place-items-center rounded-lg border text-sm font-semibold ${state === "correct" ? "border-emerald-200 bg-emerald-50 text-primary" : state === "incorrect" ? "border-red-200 bg-red-50 text-red-700" : "bg-muted text-muted-foreground"}`}>{question.questionNumber}</div>; })}</div><div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground"><Legend color="bg-emerald-100 border-emerald-200" label="Зөв"/><Legend color="bg-red-100 border-red-200" label="Буруу"/><Legend color="bg-muted" label="Хариулаагүй"/></div></section>
    </div>
  </>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) { return <div className="rounded-xl border bg-white p-5"><Icon size={18} className="text-primary"/><p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
function Legend({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-2"><i className={`h-3 w-3 rounded border ${color}`}/>{label}</span>; }
