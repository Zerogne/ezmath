import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, History, Minus, Target, TrendingUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import type { HistoryAttempt } from "@/lib/data/student-history";

const dateFormatter = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "short", day: "numeric" });

export function HistoryOverview({ attempts }: { attempts: HistoryAttempt[] }) {
  const newestFirst = [...attempts].reverse();
  if (!attempts.length) return <EmptyHistory />;

  const latest = attempts.at(-1)!;
  const averageAccuracy = Math.round(attempts.reduce((sum, item) => sum + item.accuracy, 0) / attempts.length);
  const totalSeconds = attempts.reduce((sum, item) => sum + item.durationSeconds, 0);
  const firstSameExam = attempts.find((item) => item.examType === latest.examType)!;
  const overallChange = latest.score - firstSameExam.score;

  return <div>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Явцын тайлан</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Шалгалтын ахиц</h1><p className="mt-3 max-w-2xl text-muted-foreground">Mock шалгалт бүрийн оноогоо харьцуулж, ахиц дэвшлээ нэг дороос хянаарай.</p></div>
      <ButtonLink href="/tests">Шинэ mock эхлэх <ArrowRight size={17}/></ButtonLink>
    </div>

    <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Гүйцэтгэлийн тойм">
      <Stat icon={History} label="Дуусгасан mock" value={`${attempts.length}`} note="Нийт шалгалт"/>
      <Stat icon={Target} label="Дундаж нарийвчлал" value={`${averageAccuracy}%`} note="Бүх хариултаар"/>
      <Stat icon={Clock3} label="Зарцуулсан хугацаа" value={formatDuration(totalSeconds)} note="Нийт бэлтгэл"/>
      <Stat icon={TrendingUp} label={`${latest.examType} ахиц`} value={formatChange(overallChange)} note="Эхний оролдлогоос" positive={overallChange >= 0}/>
    </section>

    <section className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Онооны өсөлт</h2><p className="mt-1 text-sm text-muted-foreground">Оноонуудыг 100%-ийн хэмжээнд харьцуулан харуулав.</p></div><div className="flex gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary"/>SAT</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-500"/>ЭЕШ</span></div></div>
      <ScoreChart attempts={attempts}/>
    </section>

    <section className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-5 sm:px-7"><div><h2 className="text-lg font-bold">Бүх оролдлого</h2><p className="mt-1 text-sm text-muted-foreground">Хамгийн сүүлийн үр дүн эхэнд байна.</p></div><span className="text-xs font-semibold text-muted-foreground">{attempts.length} mock</span></div>
      <div className="divide-y">{newestFirst.map((attempt) => <AttemptRow key={attempt.id} attempt={attempt}/>)}</div>
    </section>
  </div>;
}

function ScoreChart({ attempts }: { attempts: HistoryAttempt[] }) {
  const points = attempts.map((attempt, index) => ({ ...attempt, x: attempts.length === 1 ? 50 : 5 + index / (attempts.length - 1) * 90, y: 92 - attempt.score / attempt.maxScore * 78 }));
  const groups = (["SAT", "EYESH"] as const).map((type) => points.filter((point) => point.examType === type));
  return <div className="mt-6 overflow-x-auto"><svg viewBox="0 0 100 105" className="h-64 min-w-[620px] w-full" role="img" aria-label="Онооны өсөлтийн график">
    {[14, 33.5, 53, 72.5, 92].map((y, index) => <g key={y}><line x1="5" x2="95" y1={y} y2={y} stroke="currentColor" className="text-border" strokeWidth=".35"/><text x="1" y={y + 1.3} fontSize="2.8" className="fill-muted-foreground">{100 - index * 25}%</text></g>)}
    {groups.map((group, index) => <g key={index}>{group.length > 1 && <polyline points={group.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke={index === 0 ? "hsl(var(--primary))" : "#f59e0b"} strokeWidth="1.2" strokeLinejoin="round"/>}{group.map((point) => <g key={point.id}><circle cx={point.x} cy={point.y} r="1.8" fill={index === 0 ? "hsl(var(--primary))" : "#f59e0b"}/><text x={point.x} y={point.y - 3} textAnchor="middle" fontSize="2.8" fontWeight="700" className="fill-foreground">{point.score}</text><text x={point.x} y="101" textAnchor="middle" fontSize="2.5" className="fill-muted-foreground">{dateFormatter.format(new Date(point.completedAt)).replace(/ /g, " ")}</text></g>)}</g>)}
  </svg></div>;
}

function AttemptRow({ attempt }: { attempt: HistoryAttempt }) {
  const TrendIcon = attempt.change === null || attempt.change === 0 ? Minus : attempt.change > 0 ? ArrowUpRight : ArrowDownRight;
  return <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-7">
    <div className="min-w-0"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${attempt.examType === "SAT" ? "bg-emerald-50 text-primary" : "bg-amber-50 text-amber-700"}`}>{attempt.examType === "EYESH" ? "ЭЕШ" : "SAT"}</span><p className="truncate font-semibold">{attempt.title}</p></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13}/>{dateFormatter.format(new Date(attempt.completedAt))}</span><span>{attempt.subject}</span><span>{formatDuration(attempt.durationSeconds)}</span></div></div>
    <div className="flex items-center justify-between gap-8 sm:justify-end"><div><p className="text-2xl font-bold">{attempt.score}<span className="text-sm font-medium text-muted-foreground">/{attempt.maxScore}</span></p><p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 size={13}/>{attempt.correct}/{attempt.total} зөв · {attempt.accuracy}%</p></div><span className={`inline-flex min-w-14 items-center justify-end text-sm font-bold ${attempt.change !== null && attempt.change > 0 ? "text-emerald-700" : attempt.change !== null && attempt.change < 0 ? "text-red-600" : "text-muted-foreground"}`}><TrendIcon size={16}/>{attempt.change === null ? "—" : formatChange(attempt.change)}</span></div>
    <Link href={`/tests/${attempt.testId}`} className="inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[#E3E6EF] px-3 py-2 text-sm font-semibold hover:border-[#C9CDDA]">Дахин өгөх <ArrowRight size={15}/></Link>
  </div>;
}

function EmptyHistory() { return <div className="py-12 sm:py-20"><div className="mx-auto max-w-xl rounded-3xl border bg-white px-6 py-14 text-center shadow-sm sm:px-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-primary"><History size={26}/></div><p className="eyebrow mt-7">Явцын тайлан</p><h1 className="mt-2 text-3xl font-bold">Эхний mock-оо өгөөрэй</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">Шалгалтаа дуусгахад оноо, нарийвчлал болон дараагийн оролдлогын ахиц энд автоматаар харагдана.</p><ButtonLink href="/tests" className="mt-7">Mock шалгалт сонгох <ArrowRight size={17}/></ButtonLink></div></div>; }
function Stat({ icon: Icon, label, value, note, positive }: { icon: typeof Target; label: string; value: string; note: string; positive?: boolean }) { return <div className="rounded-2xl border bg-white p-5 shadow-sm"><Icon size={19} className="text-primary"/><p className={`mt-5 text-2xl font-bold ${positive ? "text-emerald-700" : ""}`}>{value}</p><p className="mt-1 text-sm font-medium">{label}</p><p className="mt-3 text-xs text-muted-foreground">{note}</p></div>; }
function formatDuration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.round(seconds % 3600 / 60); return hours ? `${hours}ц ${minutes}м` : `${minutes} мин`; }
function formatChange(value: number) { return `${value > 0 ? "+" : ""}${value}`; }
