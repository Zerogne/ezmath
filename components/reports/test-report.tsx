"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { loadCompletedAttempt } from "@/lib/exam/test-storage";
import type { CompletedAttempt, StudentQuestion, Test } from "@/types/exam";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/portal-ui";
import { portalCard as card } from "@/components/dashboard/portal-ui";

const STATE_STYLE = { correct: "border-[#BBF7D0] bg-[#E9FBF2] text-[#15803D]", incorrect: "border-[#FECDD3] bg-[#FFE4E6] text-[#BE123C]", unanswered: "border-[#EEF0F6] bg-[#F6F7FB] text-[#9AA0B4]" } as const;

export function TestReport({ test, questions }: { test: Test; questions: StudentQuestion[] }) {
  const [attempt, setAttempt] = useState<CompletedAttempt | null | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempt(loadCompletedAttempt(test.id));
  }, [test.id]);
  if (attempt === undefined) return <div className="h-80 animate-pulse rounded-[22px] bg-[#F1F3F8]"/>;
  if (!attempt) return <EmptyState heading="h1" pose="read" title="Тайлан олдсонгүй" text="Энэ шалгалтыг дуусгасны дараа дэлгэрэнгүй тайлан үүснэ." action={<Link href={`/tests/${test.id}`} className="btn-dark">Шалгалт руу очих</Link>}/>;
  const result = attempt.result;
  const topics = [...result.topicBreakdown].sort((a, b) => a.accuracy - b.accuracy);
  return <>
    <Link href={`/tests/${test.id}/result`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6275] hover:text-[#0B1030]"><ArrowLeft size={16}/>Үр дүн рүү буцах</Link>
    <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${test.examType === "SAT" ? "bg-[#FFF6CC] text-[#B45309]" : "bg-[#E8EEFF] text-[#2B4BE8]"}`}>{test.examType === "EYESH" ? "ЭЕШ" : "SAT"}</span><h1 className="mt-4 text-[32px] font-medium leading-tight tracking-[-0.03em] sm:text-[40px]">Гүйцэтгэлийн тайлан</h1><p className="mt-1 text-[15px] text-[#5B6275]">{test.title}</p></div>
      <Link href={`/tests/${test.id}`} className="btn-dark">Дахин шалгалт өгөх<ArrowRight size={16}/></Link>
    </div>
    <section className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard art="target" tile="#EFE6FF" label="Нарийвчлал" value={`${result.accuracy}%`} note={`${result.score} / ${result.maxScore} оноо`}/>
      <StatCard art="scorecard" tile="#E9FBF2" label="Зөв" value={`${result.correct}`} note="Зөв хариулт"/>
      <StatCard art="pencil" tile="#FFE8EF" label="Буруу / хоосон" value={`${result.incorrect + result.unanswered}`} note={`${result.unanswered} хариулаагүй`}/>
      <StatCard art="stopwatch" tile="#FFF0E6" label="Зарцуулсан" value={`${Math.floor(result.durationSeconds / 60)}:${String(result.durationSeconds % 60).padStart(2, "0")}`} note="Минут : секунд"/>
    </section>
    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
      <section className={`${card} p-6`}>
        <h2 className="font-sans text-lg font-semibold tracking-normal">Сэдвийн гүйцэтгэл</h2>
        <p className="mt-1 text-sm text-[#5B6275]">Сулаас нь эхлэн эрэмбэлэв.</p>
        <div className="mt-5 space-y-4">{topics.map((topic) => <div key={topic.topic}><div className="flex justify-between gap-3 text-sm"><span className="font-medium">{topic.topic}</span><span className="text-[#5B6275]">{topic.correct}/{topic.total} · {topic.accuracy}%</span></div><div className="mt-1.5 h-2 rounded-full bg-[#EEF0F6]"><div className={`h-full rounded-full ${topic.accuracy < 50 ? "bg-[#F472B6]" : topic.accuracy < 75 ? "bg-[#9DB0FF]" : "bg-[#2B4BE8]"}`} style={{ width: `${Math.max(topic.accuracy, 3)}%` }}/></div></div>)}</div>
      </section>
      <section className={`${card} p-6`}>
        <div className="flex items-baseline justify-between"><h2 className="font-sans text-lg font-semibold tracking-normal">Асуултын тойм</h2><span className="text-xs font-medium text-[#5B6275]">{questions.length} асуулт</span></div>
        <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-10">{questions.map((question) => { const state = result.answerResults[question.id] ?? "unanswered"; return <div key={question.id} title={state === "correct" ? "Зөв" : state === "incorrect" ? "Буруу" : "Хариулаагүй"} className={`grid h-10 place-items-center rounded-xl border-2 text-sm font-semibold ${STATE_STYLE[state]}`}>{question.questionNumber}</div>; })}</div>
        <div className="mt-5 flex flex-wrap gap-5 text-xs font-medium text-[#5B6275]"><Legend className={STATE_STYLE.correct} label="Зөв"/><Legend className={STATE_STYLE.incorrect} label="Буруу"/><Legend className={STATE_STYLE.unanswered} label="Хариулаагүй"/></div>
      </section>
    </div>
  </>;
}

function Legend({ className, label }: { className: string; label: string }) { return <span className="inline-flex items-center gap-2"><i className={`h-3.5 w-3.5 rounded border-2 ${className}`}/>{label}</span>; }
