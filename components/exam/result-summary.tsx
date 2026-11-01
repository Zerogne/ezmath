"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Home, RotateCcw, XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
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
  if (!loaded) return <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-label="Үр дүнг ачаалж байна"/>;
  if (!result) return <EmptyState heading="h1" pose="think" title="Үр дүн олдсонгүй" text="Энэ төхөөрөмж дээр хадгалсан дууссан шалгалтын үр дүн алга. Шалгалтаа дахин эхлүүлж болно." action={<><ButtonLink href={`/tests/${test.id}`}>Шалгалт руу очих</ButtonLink><ButtonLink href="/tests" variant="secondary">Бүх шалгалт</ButtonLink></>}/>;
  const used = `${Math.floor(result.durationSeconds / 60).toString().padStart(2,"0")}:${(result.durationSeconds % 60).toString().padStart(2,"0")}`;
  return <div className="rounded-[28px] border-2 border-[#EEF0F6] bg-white p-6 text-center sm:p-10"><Ezi pose={result.accuracy >= 80 ? "trophy" : result.accuracy >= 50 ? "happy" : "read"} size={140} className="mx-auto block"/><span className="eyebrow mt-2 block">Таны үр дүн</span><h1 className="mt-3 text-5xl font-medium sm:text-6xl">{result.score} / {result.maxScore}</h1><p className="mt-3 text-[#5B6275]">{test.title}</p><div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4"><ResultStat icon={<CheckCircle2/>} label="Зөв" value={result.correct}/><ResultStat icon={<XCircle/>} label="Буруу" value={result.incorrect}/><ResultStat icon={<RotateCcw/>} label="Нарийвчлал" value={`${result.accuracy}%`}/><ResultStat icon={<Clock3/>} label="Зарцуулсан" value={used}/></div>{result.unanswered > 0 && <p className="mt-4 text-sm text-muted-foreground">Хариулаагүй: {result.unanswered}</p>}<div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><ButtonLink href={`/tests/${test.id}/report`} variant="secondary">Дэлгэрэнгүй тайлан</ButtonLink><ButtonLink href="/"><Home size={17}/>Нүүр рүү буцах</ButtonLink></div></div>;
}
function ResultStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) { return <div className="rounded-[18px] bg-[#F7F8FC] p-4"><span className="mx-auto block w-fit text-[#2B4BE8] [&>svg]:h-5 [&>svg]:w-5">{icon}</span><p className="mt-3 font-display text-2xl font-medium">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
