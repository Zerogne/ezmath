"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, BookOpenCheck, RotateCcw } from "lucide-react";
import { loadCompletedAttempt } from "@/lib/exam/session-storage";
import type { SubmissionResult, Test } from "@/types/exam";
import { EmptyState } from "@/components/ui/empty-state";
import { Ezi } from "@/components/home/redesign/illustrations";

export function ResultSummary({ test }: { test: Test }) {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const attempt = loadCompletedAttempt(test.id);
    // Results are browser-persisted in this version and become available only after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(attempt?.result ?? null);
    setLoaded(true); }, [test.id]);
  if (!loaded) return <div className="h-80 animate-pulse rounded-[26px] bg-[#F1F3F8]" aria-label="Үр дүнг ачаалж байна"/>;
  if (!result) return <EmptyState heading="h1" pose="think" title="Үр дүн олдсонгүй" text="Энэ төхөөрөмж дээр хадгалсан дууссан шалгалтын үр дүн алга. Шалгалтаа дахин эхлүүлж болно." action={<><Link href={`/tests/${test.id}`} className="btn-dark">Шалгалт руу очих</Link><Link href="/tests" className="btn-outline">Бүх шалгалт</Link></>}/>;
  const used = `${Math.floor(result.durationSeconds / 60).toString().padStart(2, "0")}:${(result.durationSeconds % 60).toString().padStart(2, "0")}`;
  const weakest = [...result.topicBreakdown].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const steps = [
    { href: `/tests/${test.id}/report`, icon: BarChart3, title: "Дэлгэрэнгүй тайлан", text: "Асуулт бүрийн зөв, буруу, сэдвийн анализ", bg: "#E8EEFF" },
    { href: test.examType === "SAT" ? "/tests?exam=SAT#bank" : "/dashboard/exercises", icon: BookOpenCheck, title: "Сул сэдвээ давтах", text: test.examType === "SAT" ? "Бодлогын сангаас ур чадвараар шүүж бод" : "Сэдэвчилсэн дасгал хий", bg: "#FFF6CC" },
    { href: `/tests/${test.id}`, icon: RotateCcw, title: "Дахин өгөх", text: "Ахицаа хэмжиж, оноогоо ахиул", bg: "#E9FBF2" },
  ];
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
    <section className="rounded-[26px] border-2 border-[#EEF0F6] bg-white p-6 text-center sm:p-10">
      <Ezi pose={result.accuracy >= 80 ? "trophy" : result.accuracy >= 50 ? "celebrate" : "read"} size={150} className="mx-auto block"/>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#2B4BE8]">Таны үр дүн</p>
      <h1 className="mt-2 text-[56px] font-medium leading-none tracking-[-0.03em] sm:text-[72px]">{result.score}<span className="text-[28px] text-[#9AA0B4] sm:text-[34px]"> / {result.maxScore}</span></h1>
      <p className="mt-3 text-[#5B6275]">{test.title}</p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Зөв" value={result.correct} bg="#E9FBF2"/>
        <Stat label="Буруу" value={result.incorrect} bg="#FFE4E6"/>
        <Stat label="Нарийвчлал" value={`${result.accuracy}%`} bg="#E8EEFF"/>
        <Stat label="Зарцуулсан" value={used} bg="#FFF0E6"/>
      </div>
      {result.unanswered > 0 && <p className="mt-4 text-sm text-[#5B6275]">Хариулаагүй: {result.unanswered}</p>}
    </section>
    <aside className="space-y-4">
      <section className="rounded-[26px] border-2 border-[#EEF0F6] bg-white p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">Дараагийн алхам</h2>
        <div className="mt-4 space-y-2.5">{steps.map(({ href, icon: Icon, title, text, bg }) => <Link key={title} href={href} className="flex items-center gap-3.5 rounded-2xl border-2 border-[#EEF0F6] p-3.5 transition hover:border-[#C9CDDA]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: bg }}><Icon size={19}/></span><span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="block truncate text-xs text-[#5B6275]">{text}</span></span><ArrowRight size={16} className="shrink-0 text-[#9AA0B4]"/></Link>)}</div>
      </section>
      {weakest.length > 0 && <section className="rounded-[26px] border-2 border-[#EEF0F6] bg-white p-6">
        <h2 className="font-sans text-lg font-semibold tracking-normal">Анхаарах сэдвүүд</h2>
        <div className="mt-4 space-y-3.5">{weakest.map((topic) => <div key={topic.topic}><div className="flex justify-between text-sm"><span className="font-medium">{topic.topic}</span><span className="text-[#5B6275]">{topic.correct}/{topic.total}</span></div><div className="mt-1.5 h-2 rounded-full bg-[#EEF0F6]"><div className={`h-full rounded-full ${topic.accuracy < 50 ? "bg-[#F472B6]" : "bg-[#2B4BE8]"}`} style={{ width: `${Math.max(topic.accuracy, 3)}%` }}/></div></div>)}</div>
      </section>}
    </aside>
  </div>;
}
function Stat({ label, value, bg }: { label: string; value: string | number; bg: string }) { return <div className="rounded-[18px] p-4" style={{ background: bg }}><p className="font-display text-2xl font-medium tracking-[-0.02em]">{value}</p><p className="mt-1 text-xs font-medium text-[#5B6275]">{label}</p></div>; }
