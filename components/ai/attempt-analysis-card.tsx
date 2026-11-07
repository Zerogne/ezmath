"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, RotateCcw, Sparkles } from "lucide-react";
import { getAttemptAnalysis } from "@/app/dashboard/ai-actions";
import type { AnalysisState } from "@/lib/ai/attempt-analysis";

const card = "rounded-[26px] border-2 border-[#EEF0F6] bg-white p-6 text-left sm:p-8";
const POLL_MS = 4000;
const GIVE_UP_MS = 3 * 60 * 1000;

/** AI feedback for one submitted mock. Polls until the background generation finishes. */
export function AttemptAnalysisCard({ attemptId }: { attemptId: string }) {
  const [state, setState] = useState<AnalysisState | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const started = Date.now();
    const poll = async (first: boolean) => {
      const next = await getAttemptAnalysis(attemptId, { retry: first && retry > 0 }).catch((): AnalysisState => ({ status: "failed" }));
      if (stopped) return;
      if (next.status === "pending" && Date.now() - started > GIVE_UP_MS) { setState({ status: "failed" }); return; }
      setState(next);
      if (next.status === "pending") timer = setTimeout(() => void poll(false), POLL_MS);
    };
    void poll(true);
    return () => { stopped = true; clearTimeout(timer); };
  }, [attemptId, retry]);

  if (!state || state.status === "unavailable") return null;
  const heading = <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#7C4DEB]"><Sparkles size={16}/>AI дүн шинжилгээ</p>;

  if (state.status === "locked") return <section className={`${card} border-[#E5DAFF] bg-[#F7F3FF]`}>
    {heading}
    <p className="mt-3 flex items-start gap-2 text-[15px] leading-6"><Lock size={18} className="mt-0.5 shrink-0 text-[#7C4DEB]"/>Сорил бүрийн дараа AI таны алдааг сэдэв тус бүрээр задлан шинжилж, дараагийн алхмыг зөвлөнө. Энэ боломж төлбөртэй багцад багтана.</p>
    <Link href="/pricing" className="btn-dark mt-5">Багц сонгох</Link>
  </section>;

  if (state.status === "pending") return <section className={card} aria-busy>
    {heading}
    <p className="mt-3 flex items-center gap-2 text-[15px] text-[#5B6275]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#7C4DEB]"/>Таны хариултыг шинжилж байна…</p>
    <div className="mt-5 space-y-2.5">{[90, 75, 82].map((width) => <div key={width} className="h-3 animate-pulse rounded-full bg-[#F1F3F8]" style={{ width: `${width}%` }}/>)}</div>
  </section>;

  if (state.status === "failed") return <section className={card}>
    {heading}
    <p className="mt-3 text-[15px] text-[#5B6275]">Дүн шинжилгээ гаргаж чадсангүй.</p>
    <button type="button" onClick={() => { setState({ status: "pending" }); setRetry((value) => value + 1); }} className="btn-outline mt-4"><RotateCcw size={16}/>Дахин оролдох</button>
  </section>;

  const { analysis } = state;
  return <section className={card}>
    {heading}
    <p className="mt-3 text-[16px] leading-7">{analysis.summary}</p>
    {analysis.strengths.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-[#15803D]">Сайн тал</h3><ul className="mt-2 space-y-1.5 text-[15px] leading-6">{analysis.strengths.map((item) => <li key={item} className="flex gap-2"><span className="text-[#16A34A]">✓</span>{item}</li>)}</ul></div>}
    {analysis.weaknesses.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-[#BE123C]">Анхаарах сэдвүүд</h3><div className="mt-2 space-y-2.5">{analysis.weaknesses.map((item) => <div key={item.topic} className="rounded-2xl bg-[#FFF5F6] p-4"><p className="font-semibold">{item.topic}</p><p className="mt-1 text-sm leading-6 text-[#5B6275]">{item.issue}</p><p className="mt-1.5 text-sm font-medium leading-6">→ {item.action}</p></div>)}</div></div>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl bg-[#FFF0E6] p-4"><h3 className="text-sm font-semibold">Цагийн менежмент</h3><p className="mt-1 text-sm leading-6">{analysis.timeManagement}</p></div>
      <div className="rounded-2xl bg-[#E8EEFF] p-4"><h3 className="text-sm font-semibold">Зорилго хүртэл</h3><p className="mt-1 text-sm leading-6">{analysis.goalOutlook}</p></div>
    </div>
    {analysis.nextSteps.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold">Дараагийн алхмууд</h3><ol className="mt-2 space-y-1.5 text-[15px] leading-6">{analysis.nextSteps.map((item, index) => <li key={item} className="flex gap-2.5"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0B1030] text-xs font-bold text-white">{index + 1}</span>{item}</li>)}</ol></div>}
  </section>;
}
