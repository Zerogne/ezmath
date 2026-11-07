"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, CalendarCheck, Coffee, Dumbbell, Lock, RotateCcw, Sparkles, Timer, Repeat } from "lucide-react";
import { getStudyPlan } from "@/app/dashboard/ai-actions";
import type { PlanState, StudyPlan } from "@/lib/ai/study-plan";

const card = "rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 sm:p-[22px]";
const KIND = {
  lesson: { icon: BookOpen, bg: "#E8EEFF", fg: "#2B4BE8", label: "Хичээл" },
  exercise: { icon: Dumbbell, bg: "#FFF6CC", fg: "#B45309", label: "Дасгал" },
  mock: { icon: Timer, bg: "#EFE6FF", fg: "#7C4DEB", label: "Mock" },
  review: { icon: Repeat, bg: "#E9FBF2", fg: "#15803D", label: "Давталт" },
  rest: { icon: Coffee, bg: "#F1F3F8", fg: "#5B6275", label: "Амралт" },
} as const;
const POLL_MS = 4000;
const GIVE_UP_MS = 3 * 60 * 1000;

/** This week's AI study plan with today's tasks first. The plan is generated on the first visit of the week. */
export function StudyPlanCard({ today }: { today: number }) {
  const [state, setState] = useState<PlanState | null>(null);
  const [retry, setRetry] = useState(0);
  const [showWeek, setShowWeek] = useState(false);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    const poll = async (first: boolean) => {
      const next = await getStudyPlan({ retry: first && retry > 0 }).catch((): PlanState => ({ status: "failed" }));
      if (stopped) return;
      if (next.status === "pending" && Date.now() - started > GIVE_UP_MS) { setState({ status: "failed" }); return; }
      setState(next);
      if (next.status === "pending") timer = setTimeout(() => void poll(false), POLL_MS);
    };
    void poll(true);
    return () => { stopped = true; clearTimeout(timer); };
  }, [retry]);

  if (!state || state.status === "unavailable") return null;
  const header = <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-sans text-lg font-semibold tracking-normal"><Sparkles size={18} className="text-[#7C4DEB]"/>Энэ 7 хоногийн төлөвлөгөө</h2><span className="rounded-full bg-[#EFE6FF] px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] text-[#7C4DEB]">AI</span></div>;

  if (state.status === "locked") return <section className={`${card} border-[#E5DAFF] bg-[#F7F3FF]`}>
    {header}
    <p className="mt-3 flex items-start gap-2 text-sm leading-6"><Lock size={16} className="mt-1 shrink-0 text-[#7C4DEB]"/>Таны зорилго, сул сэдэв, чөлөөт цагт тохирсон 7 хоног бүрийн хувийн төлөвлөгөөг AI гаргана. Төлбөртэй багцад багтана.</p>
    <Link href="/pricing" className="btn-dark mt-4">Багц сонгох</Link>
  </section>;

  if (state.status === "pending") return <section className={card} aria-busy>
    {header}
    <p className="mt-3 flex items-center gap-2 text-sm text-[#5B6275]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#7C4DEB]"/>Таны төлөвлөгөөг бэлдэж байна…</p>
    <div className="mt-4 space-y-2.5">{[85, 70, 78].map((width) => <div key={width} className="h-3 animate-pulse rounded-full bg-[#F1F3F8]" style={{ width: `${width}%` }}/>)}</div>
  </section>;

  if (state.status === "failed") return <section className={card}>
    {header}
    <p className="mt-3 text-sm text-[#5B6275]">Төлөвлөгөө гаргаж чадсангүй.</p>
    <button type="button" onClick={() => { setState({ status: "pending" }); setRetry((value) => value + 1); }} className="btn-outline mt-4"><RotateCcw size={16}/>Дахин оролдох</button>
  </section>;

  const { plan } = state;
  const day = plan.days[today];
  return <section className={card}>
    {header}
    <p className="mt-2 text-sm leading-6 text-[#5B6275]">{plan.focus}</p>
    {day && <div className="mt-4 rounded-2xl bg-[#F7F8FC] p-4">
      <p className="flex items-center justify-between text-sm font-semibold"><span className="flex items-center gap-1.5"><CalendarCheck size={16} className="text-[#2B4BE8]"/>Өнөөдөр · {day.day}</span>{day.minutes > 0 && <span className="text-xs text-[#5B6275]">~{day.minutes} мин</span>}</p>
      <Tasks tasks={day.tasks}/>
    </div>}
    <button type="button" onClick={() => setShowWeek((value) => !value)} className="mt-4 text-sm font-semibold text-[#2B4BE8] hover:underline" aria-expanded={showWeek}>{showWeek ? "Нуух" : "Бүх 7 хоногийг харах"}</button>
    {showWeek && <div className="mt-3 space-y-3">{plan.days.map((item, index) => index !== today && <div key={item.day} className="rounded-2xl border-2 border-[#EEF0F6] p-4">
      <p className="flex items-center justify-between text-sm font-semibold"><span className={index < today ? "text-[#9AA0B4]" : ""}>{item.day}</span>{item.minutes > 0 && <span className="text-xs text-[#5B6275]">~{item.minutes} мин</span>}</p>
      <Tasks tasks={item.tasks}/>
    </div>)}</div>}
    {plan.tips.length > 0 && <ul className="mt-4 space-y-1 text-xs leading-5 text-[#5B6275]">{plan.tips.map((tip) => <li key={tip}>💡 {tip}</li>)}</ul>}
  </section>;
}

function Tasks({ tasks }: { tasks: StudyPlan["days"][number]["tasks"] }) {
  if (!tasks.length) return <p className="mt-2 text-sm text-[#5B6275]">Амралтын өдөр.</p>;
  return <ul className="mt-3 space-y-2.5">{tasks.map((task) => {
    const kind = KIND[task.kind];
    const Icon = kind.icon;
    return <li key={`${task.kind}-${task.title}`} className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: kind.bg, color: kind.fg }} title={kind.label}><Icon size={16}/></span>
      <span className="min-w-0"><span className="block text-sm font-semibold">{task.title}</span><span className="block text-xs leading-5 text-[#5B6275]">{task.detail}</span></span>
    </li>;
  })}</ul>;
}
