"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Home, RotateCcw, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { loadCompletedAttempt } from "@/lib/exam/session-storage";
import type { SubmissionResult, Test } from "@/types/exam";

export function ResultSummary({ test }: { test: Test }) {
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const attempt = loadCompletedAttempt(test.id);
    // Results are browser-persisted in this version and become available only after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(attempt?.result ?? null);
    setLoaded(true); }, [test.id]);
  if (!loaded) return <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-label="Үр дүнг ачаалж байна"/>;
  if (!result) return <div className="rounded-2xl border bg-white p-8 text-center shadow-soft sm:p-10"><h1 className="text-2xl font-bold">Үр дүн олдсонгүй</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Энэ төхөөрөмж дээр хадгалсан дууссан шалгалтын үр дүн алга. Шалгалтаа дахин эхлүүлж болно.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href={`/tests/${test.id}`}>Шалгалт руу очих</ButtonLink><ButtonLink href="/tests" variant="secondary">Бүх шалгалт</ButtonLink></div></div>;
  const used = `${Math.floor(result.durationSeconds / 60).toString().padStart(2,"0")}:${(result.durationSeconds % 60).toString().padStart(2,"0")}`;
  return <div className="rounded-2xl border bg-white p-6 text-center shadow-soft sm:p-10"><span className="eyebrow">Таны үр дүн</span><h1 className="mt-4 text-4xl font-bold sm:text-5xl">{result.score} / {result.maxScore}</h1><p className="mt-3 text-muted-foreground">{test.title}</p><div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4"><ResultStat icon={<CheckCircle2/>} label="Зөв" value={result.correct}/><ResultStat icon={<XCircle/>} label="Буруу" value={result.incorrect}/><ResultStat icon={<RotateCcw/>} label="Нарийвчлал" value={`${result.accuracy}%`}/><ResultStat icon={<Clock3/>} label="Зарцуулсан" value={used}/></div>{result.unanswered > 0 && <p className="mt-4 text-sm text-muted-foreground">Хариулаагүй: {result.unanswered}</p>}<div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href={`/tests/${test.id}/report`} variant="secondary">Дэлгэрэнгүй тайлан</ButtonLink><ButtonLink href="/"><Home size={17}/>Нүүр рүү буцах</ButtonLink></div></div>;
}
function ResultStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) { return <div className="bg-white p-4"><span className="mx-auto block w-fit text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><p className="mt-3 text-xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
