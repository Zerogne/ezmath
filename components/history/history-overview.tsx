import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Minus } from "lucide-react";
import type { HistoryAttempt } from "@/lib/data/student-history";
import { PortalHeader } from "@/components/dashboard/portal-shell";
import { btnSmDark, btnSmOutline, Chip, portalCard, portalMuted, SectionTitle, StatCard } from "@/components/dashboard/portal-ui";
import { EmptyState } from "@/components/ui/empty-state";

const dateFormatter = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "short", day: "numeric" });
const shortDate = new Intl.DateTimeFormat("mn-MN", { month: "2-digit", day: "2-digit" });

export function HistoryOverview({ attempts }: { attempts: HistoryAttempt[] }) {
  if (!attempts.length) return <><PortalHeader title="Явцын тайлан" description="Mock шалгалт бүрийн оноогоо харьцуулж, ахиц дэвшлээ нэг дороос хянаарай."/><EmptyState className="mt-6" heading="h2" pose="point" title="Эхний mock-оо өгөөрэй" text="Шалгалтаа дуусгахад оноо, нарийвчлал болон дараагийн оролдлогын ахиц энд автоматаар харагдана." action={<Link href="/tests" className={btnSmDark}>Mock шалгалт сонгох<ArrowRight size={15}/></Link>}/></>;

  const newestFirst = [...attempts].reverse();
  const latest = attempts.at(-1)!;
  const averageAccuracy = Math.round(attempts.reduce((sum, item) => sum + item.accuracy, 0) / attempts.length);
  const totalSeconds = attempts.reduce((sum, item) => sum + item.durationSeconds, 0);
  const firstSameExam = attempts.find((item) => item.examType === latest.examType)!;
  const overallChange = latest.score - firstSameExam.score;

  return <div>
    <PortalHeader title="Явцын тайлан" description="Mock шалгалт бүрийн оноогоо харьцуулж, ахиц дэвшлээ нэг дороос хянаарай." action={<Link href="/tests" className={btnSmDark}>Шинэ mock эхлэх<ArrowRight size={15}/></Link>}/>

    <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Гүйцэтгэлийн тойм">
      <StatCard art="scorecard" tile="#E8EEFF" label="Дуусгасан mock" value={`${attempts.length}`} note="Нийт шалгалт"/>
      <StatCard art="target" tile="#EFE6FF" label="Дундаж нарийвчлал" value={`${averageAccuracy}%`} note="Бүх хариултаар"/>
      <StatCard art="stopwatch" tile="#FFF0E6" label="Зарцуулсан хугацаа" value={formatDuration(totalSeconds)} note="Нийт бэлтгэл"/>
      <StatCard art="chart" tile="#E9FBF2" label={`${latest.examType === "EYESH" ? "ЭЕШ" : "SAT"} ахиц`} value={formatChange(overallChange)} note="Эхний оролдлогоос" positive={overallChange > 0}/>
    </section>

    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={`${portalCard} min-w-0 p-5 sm:p-6`}>
        <SectionTitle title="Онооны өсөлт" text="Оноонуудыг 100%-ийн хэмжээнд харьцуулан харуулав." action={<div className={`flex gap-3 text-xs ${portalMuted}`}><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#2B4BE8]"/>SAT</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#D97706]"/>ЭЕШ</span></div>}/>
        <ScoreChart attempts={attempts}/>
      </section>
      <TopicBreakdown attempts={attempts}/>
    </div>

    <section className={`${portalCard} mt-4 overflow-hidden`}>
      <div className="flex items-center justify-between border-b-2 border-[#F4F5FA] px-5 py-5 sm:px-6"><SectionTitle title="Бүх оролдлого" text="Хамгийн сүүлийн үр дүн эхэнд байна."/><Chip tone="grey">{attempts.length} mock</Chip></div>
      <div className="divide-y-2 divide-[#F4F5FA]">{newestFirst.map((attempt) => <AttemptRow key={attempt.id} attempt={attempt}/>)}</div>
    </section>
  </div>;
}

function ScoreChart({ attempts }: { attempts: HistoryAttempt[] }) {
  const W = 320, left = 26, right = 312, top = 14, bottom = 96;
  const points = attempts.map((attempt, index) => ({ ...attempt, x: attempts.length === 1 ? (left + right) / 2 : left + 8 + index / (attempts.length - 1) * (right - left - 16), y: bottom - attempt.score / attempt.maxScore * (bottom - top) }));
  const groups = (["SAT", "EYESH"] as const).map((type) => points.filter((point) => point.examType === type));
  const colors = ["#2B4BE8", "#D97706"];
  return <div className="mt-5 overflow-x-auto"><svg viewBox={`0 0 ${W} 108`} className="block h-[230px] w-full min-w-[520px]" role="img" aria-label="Онооны өсөлтийн график">
    {[0, 0.25, 0.5, 0.75, 1].map((fraction) => { const y = bottom - fraction * (bottom - top); return <g key={fraction}><line x1={left} x2={right} y1={y} y2={y} stroke="#EEF0F6" strokeWidth=".6"/><text x="0" y={y + 1.6} fontSize="5" fill="#9AA0B4">{fraction * 100}%</text></g>; })}
    {groups.map((group, index) => <g key={index}>
      {group.length > 1 && <polyline points={group.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={colors[index]} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>}
      {group.map((point) => <g key={point.id}><circle cx={point.x} cy={point.y} r="2.6" fill="#fff" stroke={colors[index]} strokeWidth="1.4"/><text x={point.x} y={point.y - 5} textAnchor="middle" fontSize="5" fontWeight="600" fill="#0B1030">{point.score}</text><text x={point.x} y="105" textAnchor="middle" fontSize="4.6" fill="#9AA0B4">{shortDate.format(new Date(point.completedAt))}</text></g>)}
    </g>)}
  </svg></div>;
}

function TopicBreakdown({ attempts }: { attempts: HistoryAttempt[] }) {
  const totals = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) for (const topic of attempt.topics ?? []) {
    const current = totals.get(topic.topic) ?? { correct: 0, total: 0 };
    totals.set(topic.topic, { correct: current.correct + topic.correct, total: current.total + topic.total });
  }
  const topics = [...totals].map(([topic, value]) => ({ topic, accuracy: value.total ? Math.round(value.correct / value.total * 100) : 0 })).sort((a, b) => a.accuracy - b.accuracy).slice(0, 6);
  return <section className={`${portalCard} p-5 sm:p-6`}>
    <SectionTitle title="Сэдвийн гүйцэтгэл" text="Зөв хариултын хувиар, сулаас нь эхлэн."/>
    {topics.length ? <div className="mt-4 space-y-3.5">{topics.map((item) => <div key={item.topic}><div className="flex justify-between text-sm"><span className="font-medium">{item.topic}</span><span className={portalMuted}>{item.accuracy}%</span></div><div className="mt-1.5 h-2 rounded-full bg-[#EEF0F6]"><div className={`h-full rounded-full ${item.accuracy < 50 ? "bg-[#F472B6]" : item.accuracy < 75 ? "bg-[#9DB0FF]" : "bg-[#2B4BE8]"}`} style={{ width: `${Math.max(item.accuracy, 3)}%` }}/></div></div>)}</div> : <p className={`mt-4 text-sm ${portalMuted}`}>Сэдвийн задаргаа хараахан алга.</p>}
    <Link href="/tests?exam=SAT#bank" className={`${btnSmOutline} mt-5 w-full`}>Сул сэдвээ давтах</Link>
  </section>;
}

function AttemptRow({ attempt }: { attempt: HistoryAttempt }) {
  const TrendIcon = attempt.change === null || attempt.change === 0 ? Minus : attempt.change > 0 ? ArrowUpRight : ArrowDownRight;
  return <div className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6">
    <div className="flex min-w-0 items-center gap-3.5"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xs font-semibold ${attempt.examType === "SAT" ? "bg-[#FFF6CC] text-[#B45309]" : "bg-[#E8EEFF] text-[#2B4BE8]"}`}>{attempt.examType === "EYESH" ? "ЭЕШ" : "SAT"}</span><div className="min-w-0"><p className="truncate font-semibold">{attempt.title}</p><div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs ${portalMuted}`}><span className="inline-flex items-center gap-1"><CalendarDays size={12}/>{dateFormatter.format(new Date(attempt.completedAt))}</span><span>{formatDuration(attempt.durationSeconds)}</span><span className="inline-flex items-center gap-1"><CheckCircle2 size={12}/>{attempt.correct}/{attempt.total} зөв</span></div></div></div>
    <div className="flex items-center justify-between gap-6 sm:justify-end"><p className="font-display text-2xl font-medium tracking-[-0.02em]">{attempt.score}<span className="text-sm text-[#5B6275]"> / {attempt.maxScore}</span></p><span className={`inline-flex min-w-14 items-center justify-end text-sm font-semibold ${attempt.change !== null && attempt.change > 0 ? "text-[#16A34A]" : attempt.change !== null && attempt.change < 0 ? "text-red-600" : "text-[#9AA0B4]"}`}><TrendIcon size={16}/>{attempt.change === null ? "—" : formatChange(attempt.change)}</span></div>
    <Link href={`/tests/${attempt.testId}`} className={btnSmOutline}>Дахин өгөх</Link>
  </div>;
}

function formatDuration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.round(seconds % 3600 / 60); return hours ? `${hours}ц ${minutes}м` : `${minutes} мин`; }
function formatChange(value: number) { return `${value > 0 ? "+" : ""}${value}`; }
