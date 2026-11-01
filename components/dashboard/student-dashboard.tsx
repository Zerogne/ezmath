import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { StudentDashboardData } from "@/lib/data/student-dashboard";
import { PlanBadge, PortalShell } from "@/components/dashboard/portal-shell";
import { Art, Ezi, ObjectArt, type ObjectKind } from "@/components/home/redesign/illustrations";
import { joinClass } from "@/app/dashboard/classes/actions";

const DAILY_GOAL = 20;
const card = "rounded-[22px] border-2 border-[#EEF0F6] bg-white";
const TYPE_LABEL = { full: "Бүрэн mock", practice: "Дасгал", "previous-year": "Өмнөх оны" } as const;

export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const attempts = data.attempts;
  const answered = attempts.reduce((sum, item) => sum + item.total, 0);
  const correct = attempts.reduce((sum, item) => sum + item.correct, 0);
  const averageAccuracy = answered ? Math.round(correct / answered * 100) : 0;
  const satAttempts = attempts.filter((item) => item.examType === "SAT");
  const satAverage = satAttempts.length ? Math.round(satAttempts.reduce((sum, item) => sum + item.score, 0) / satAttempts.length) : 0;
  const scoreChange = satAttempts.length > 1 ? satAttempts.at(-1)!.score - satAttempts.at(-2)!.score : 0;
  const recent = [...attempts].reverse().slice(0, 3);
  const weekly = weeklyActivity(attempts);
  const attemptedIds = new Set(attempts.map((attempt) => attempt.testId));
  const nextTest = data.tests.find((test) => !attemptedIds.has(test.id)) ?? data.tests[0];
  const solvedToday = solvedTodayCount(attempts);

  return <PortalShell active="/dashboard" plan={{ code: data.planCode, periodEnd: data.planExpiresAt }}>
        <header className="flex flex-wrap items-center gap-4">
          <div><h1 className="text-[26px] font-medium tracking-[-0.03em] sm:text-[30px]">Сайн уу, {firstName(data.name)} 👋</h1><p className="mt-1 text-[15px] text-[#5B6275]">Өнөөдрийн зорилт: {DAILY_GOAL} бодлого. Бэлтгэлээ үргэлжлүүлээрэй.</p></div>
          <div className="ml-auto hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-3 rounded-full border-2 border-[#EEF0F6] bg-white px-4 py-2.5"><GoalRing value={Math.min(1, solvedToday / DAILY_GOAL)}/><div><p className="text-sm font-semibold">{Math.min(solvedToday, 999)} / {DAILY_GOAL} бодлого</p><p className="text-xs text-[#5B6275]">Өнөөдрийн зорилт</p></div></div>
            <Link href="/dashboard/settings" aria-label="Профайл болон тохиргоо" className="flex items-center gap-2.5 rounded-2xl border-2 border-[#EEF0F6] bg-white py-1.5 pl-1.5 pr-3.5 hover:border-[#C9CDDA]"><Avatar data={data}/><div><p className="max-w-32 truncate text-[13px] font-semibold">{firstName(data.name)}</p><PlanBadge code={data.planCode}/></div></Link>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <Kpi art="target" tile="#EFE6FF" label="Ерөнхий эзэмшилт" value={`${averageAccuracy}%`} note={attempts.length ? `${attempts.length} сорилын нийлбэр үр дүн` : "Эхний сорилоо өгөөрэй"}/>
          <Kpi art="flame" tile="#FFF0E6" label="Дадлагын цуврал" value={`${currentStreak(attempts)} хоног`} note="Дараалсан идэвхтэй өдрүүд"/>
          <Kpi art="notebook" tile="#E8EEFF" label="Бодсон бодлого" value={answered.toLocaleString("en-US")} note={`Нийт ${attempts.length} сорил`}/>
          <Kpi art="calculator" tile="#E9FBF2" label="SAT mock дундаж" value={satAverage ? `${satAverage} / 800` : "— / 800"} note={scoreChange ? `${scoreChange > 0 ? "↑ +" : "↓ "}${scoreChange} өмнөхөөс` : "Онооны түүх хүлээгдэж байна"} positive={scoreChange > 0}/>
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4"><NextExam test={nextTest}/><RecentTests attempts={recent}/><ActivityCard values={weekly}/></div>
          <div className="space-y-4"><WeakTopics attempts={attempts}/><JoinClassCard/><QuestionBankCard/></div>
        </div>
  </PortalShell>;
}

function Avatar({ data }: { data: StudentDashboardData }) { return data.avatarUrl ? <span role="img" aria-label={`${data.name} профайл зураг`} className="h-10 w-10 rounded-[20px] bg-cover bg-center" style={{backgroundImage:`url(${JSON.stringify(data.avatarUrl)})`}}/> : <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-[20px] bg-[#FFE4EF]" aria-label={initials(data.name)}><Art name="friend-coral" size={40}/></span>; }

function GoalRing({ value }: { value: number }) {
  const length = 2 * Math.PI * 14;
  return <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden><circle cx="17" cy="17" r="14" fill="none" stroke="#EEF0F6" strokeWidth="5"/><circle cx="17" cy="17" r="14" fill="none" stroke="#2B4BE8" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${value * length} ${length}`} transform="rotate(-90 17 17)"/></svg>;
}

/** Plan card with Эзи peeking over it, at the bottom of the sidebar. */

function Kpi({ art, tile, label, value, note, positive = false }: { art: ObjectKind; tile: string; label: string; value: string; note: string; positive?: boolean }) {
  return <article className={`${card} flex items-center gap-3.5 p-4 sm:p-[22px]`}>
    <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-[20px] sm:grid" style={{ background: tile }}><ObjectArt kind={art} size={56}/></span>
    <div className="min-w-0"><p className="text-[13px] font-medium text-[#5B6275]">{label}</p><p className="mt-0.5 font-display text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[30px]">{value}</p><p className={`mt-0.5 text-xs font-medium ${positive ? "text-[#16A34A]" : "text-[#5B6275]"}`}>{note}</p></div>
  </article>;
}

function NextExam({ test }: { test: StudentDashboardData["tests"][number] | undefined }) {
  return <section className="relative overflow-hidden rounded-[22px] border-2 border-[#DCE5FF] bg-[#E8EEFF] p-6 sm:min-h-[230px] sm:p-[30px]">
    <svg className="absolute -right-6 -top-10 hidden h-[320px] w-[360px] sm:block" viewBox="0 0 360 320" fill="none" aria-hidden><path d="M120 20 C200 -10 330 10 350 90 C370 170 330 220 350 290 L360 330 L40 330 C20 260 60 230 50 170 C40 110 60 45 120 20 Z" fill="#D4DEFF"/></svg>
    <span className="absolute right-[150px] top-7 hidden h-[92px] w-[92px] rotate-[-8deg] place-items-center rounded-[28px] bg-[#FFF6CC] shadow-[0_16px_34px_-14px_rgba(11,16,48,.28)] sm:grid"><ObjectArt kind="stopwatch" size={72}/></span>
    <Ezi pose="point" size={150} className="absolute bottom-2 right-8 hidden sm:block"/>
    <div className="relative max-w-[440px]">
      <p className="text-[11px] font-bold tracking-[0.14em] text-[#2B4BE8]">ДАРААГИЙН СОРИЛ</p>
      <h2 className="mt-2.5 text-[26px] font-medium leading-tight sm:text-[32px]">{test?.title ?? "Шинэ сорил хүлээгдэж байна"}</h2>
      {test && <div className="mt-3.5 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white px-2.5 py-1">{test.questionCount} бодлого</span><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1"><Clock3 size={13}/>{test.durationMinutes} мин</span><span className="rounded-full bg-white px-2.5 py-1">{TYPE_LABEL[test.type]}</span></div>}
      <div className="mt-[22px] flex flex-wrap gap-2.5"><Link href={test ? `/tests/${test.id}` : "/dashboard/exams"} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0B1030] px-5 text-sm font-semibold text-white hover:bg-[#1A2150]">{test ? "Сорил эхлэх" : "Сорилууд"}<ArrowRight size={16}/></Link><Link href="/dashboard/exams" className="inline-flex h-11 items-center rounded-full border-2 border-[#E3E6EF] bg-white px-5 text-sm font-semibold hover:border-[#C9CDDA]">Бусад сорил</Link></div>
    </div>
  </section>;
}

function RecentTests({ attempts }: { attempts: StudentDashboardData["attempts"] }) {
  return <section className={`${card} p-5 sm:p-[22px]`}>
    <div className="flex items-center justify-between"><h2 className="font-sans text-base font-semibold tracking-normal">Сүүлийн сорилууд</h2><Link href="/dashboard/progress" className="text-[13px] font-semibold text-[#2B4BE8]">Бүгдийг харах →</Link></div>
    <div className="mt-3">{attempts.length ? attempts.map((attempt) => {
      const sat = attempt.examType === "SAT";
      return <div key={attempt.id} className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-t-2 border-[#F4F5FA] py-3.5 md:grid-cols-[46px_minmax(0,1fr)_180px_auto]">
        <span className={`grid h-[46px] w-[46px] place-items-center rounded-[14px] text-xs font-semibold ${sat ? "bg-[#FFF6CC] text-[#B98400]" : "bg-[#E8EEFF] text-[#2B4BE8]"}`}>{sat ? "SAT" : "ЭЕШ"}</span>
        <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{attempt.title}</p><p className="mt-0.5 text-[13px] text-[#5B6275]">{formatShortDate(attempt.completedAt)} · {Math.max(1, Math.round(attempt.durationSeconds / 60))} мин</p></div>
        <div className="col-span-2 md:col-span-1"><p className="flex justify-between text-xs text-[#5B6275]">Зөв хариулт<b className="text-[#0B1030]">{attempt.accuracy}%</b></p><div className="mt-1.5 h-2 rounded-full bg-[#EEF0F6]"><i className="block h-full rounded-full bg-[#2B4BE8]" style={{ width: `${attempt.accuracy}%` }}/></div></div>
        <div className="col-span-2 flex items-center justify-end gap-3 md:col-span-1"><b className="font-display text-xl font-medium tracking-[-0.03em]">{sat ? `${attempt.score} / ${attempt.maxScore}` : `${attempt.correct} / ${attempt.total}`}</b><Link href={`/tests/${attempt.testId}`} aria-label={`${attempt.title} сорилыг дахин өгөх`} className="inline-flex h-9 items-center rounded-full border-2 border-[#E3E6EF] bg-white px-3.5 text-[13px] font-semibold hover:border-[#C9CDDA]">Дахин өгөх</Link></div>
      </div>;
    }) : <div className="flex items-center gap-4 border-t-2 border-[#F4F5FA] py-5"><Ezi pose="sleep" size={64}/><p className="text-sm text-[#5B6275]">Одоогоор сорил өгөөгүй байна. Эхний сорилоо өгөөд ахицаа эндээс хараарай.</p></div>}</div>
  </section>;
}

function ActivityCard({ values }: { values: { day: string; count: number }[] }) {
  const max = Math.max(...values.map((item) => item.count), 1);
  const peak = values.findIndex((item) => item.count === max && max > 0);
  return <section className={`${card} p-5 sm:p-[22px]`}>
    <div className="flex flex-wrap justify-between gap-2"><h2 className="font-sans text-base font-semibold tracking-normal">Долоо хоногийн идэвх</h2><span className="text-[13px] font-medium text-[#5B6275]">Өдөрт бодсон бодлого · нийт {values.reduce((sum, item) => sum + item.count, 0)}</span></div>
    <div className="mt-[18px] flex gap-2.5 border-b-2 border-[#EEF0F6]">{values.map((item, index) => <div key={item.day} className="flex flex-1 flex-col items-center gap-2 pb-2">
      <div className="flex h-[150px] w-full flex-col items-center justify-end gap-1.5">{index === peak && <span className="text-xs font-semibold">{item.count}</span>}<i className={`block w-[34px] max-w-full rounded-b-[3px] rounded-t-lg ${index === peak ? "bg-[#2B4BE8]" : "bg-[#9DB0FF]"}`} style={{ height: `${Math.max(item.count ? 8 : 4, Math.round(item.count / max * 129))}px` }}/></div>
      <span className="text-[11px] font-medium text-[#9AA0B4]">{item.day}</span>
    </div>)}</div>
  </section>;
}

function WeakTopics({ attempts }: { attempts: StudentDashboardData["attempts"] }) {
  const totals = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) for (const topic of attempt.topics) { const value = totals.get(topic.topic) ?? { correct: 0, total: 0 }; value.correct += topic.correct; value.total += topic.total; totals.set(topic.topic, value); }
  const topics = [...totals].map(([name, value]) => ({ name, accuracy: value.total ? Math.round(value.correct / value.total * 100) : 0 })).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  return <section className={`${card} p-5 sm:p-[22px]`}>
    <div className="flex items-center justify-between gap-3"><h2 className="font-sans text-base font-semibold tracking-normal">Анхаарах сэдвүүд</h2>{topics.length > 0 && <span className="rounded-full bg-[#FFE4EF] px-2.5 py-1 text-xs font-semibold text-[#BE185D]">{topics.length} сэдэв</span>}</div>
    <p className="mt-1.5 text-[13px] text-[#5B6275]">Зөв хариултын хувь хамгийн бага сэдвүүд</p>
    {topics.length ? <div className="mt-1">{topics.map((topic) => <div key={topic.name} className="pt-3.5"><p className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{topic.name}</span><span className="text-[#5B6275]">{topic.accuracy}%</span></p><div className="mt-[7px] h-2 rounded-full bg-[#EEF0F6]"><i className="block h-full rounded-full bg-[#2B4BE8]" style={{ width: `${topic.accuracy}%` }}/></div></div>)}</div>
      : <p className="mt-4 rounded-xl bg-[#F7F8FC] px-3 py-3 text-[13px] text-[#5B6275]">Сорил өгсний дараа сул сэдвүүд энд харагдана.</p>}
    <Link href="/question-bank" className="mt-5 flex h-11 items-center justify-center rounded-full bg-[#2B4BE8] px-5 text-sm font-semibold text-white hover:bg-[#2440C8]">Эдгээрээр дасгал хийх</Link>
  </section>;
}

function JoinClassCard() {
  return <section className={`${card} relative overflow-hidden p-5 sm:p-[22px]`}>
    <span className="absolute right-3 top-3"><ObjectArt kind="gradcap" size={72}/></span>
    <h2 className="max-w-[220px] font-sans text-base font-semibold tracking-normal">Багшийн ангид нэгдэх</h2>
    <p className="mt-1.5 max-w-[220px] text-[13px] text-[#5B6275]">Ангийн код байгаа юу? Багшийнхаа ангид нэгдэж даалгавраа аваарай.</p>
    <form action={joinClass} className="mt-4 flex gap-2"><input name="code" required minLength={6} maxLength={10} autoCapitalize="characters" aria-label="Ангийн код" placeholder="Жишээ: EZM7K2P" className="h-11 min-w-0 flex-1 rounded-xl border-2 border-[#E3E6EF] bg-white px-3.5 font-mono text-sm uppercase tracking-[.08em] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9AA0B4] focus:border-[#2B4BE8] focus:outline-none"/><button className="h-11 shrink-0 rounded-full bg-[#0B1030] px-4 text-sm font-semibold text-white hover:bg-[#1A2150]">Код оруулах</button></form>
  </section>;
}

/** Takes the design's yellow card slot (once "ask a teacher") to point at the SAT question bank. */
function QuestionBankCard() {
  return <section className="relative overflow-hidden rounded-[22px] border-2 border-[#FFEDA3] bg-[#FFF6CC] py-5 pl-5 pr-[120px] sm:py-[22px] sm:pl-[22px]">
    <h2 className="font-sans text-base font-semibold tracking-normal">Бодлогын сан</h2>
    <p className="mt-2 text-[13px] leading-5 text-[#5C4A12]">SAT-ын ур чадвар бүрээр шүүж бод. Буруу хариулсан асуултаа дахин давт.</p>
    <Link href="/question-bank" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#0B1030] px-5 text-sm font-semibold text-white hover:bg-[#1A2150]">Бодлогын сан нээх</Link>
    <Art name="friend-sun" size={110} className="absolute -bottom-3 right-1"/>
  </section>;
}

function solvedTodayCount(attempts: StudentDashboardData["attempts"]) { const today = localDateKey(new Date()); return attempts.filter((attempt) => localDateKey(new Date(attempt.completedAt)) === today).reduce((sum, attempt) => sum + attempt.total, 0); }
function formatShortDate(value: string) { const date = new Date(value); return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`; }
function weeklyActivity(attempts: StudentDashboardData["attempts"]) { const days = ["Да","Мя","Лх","Пү","Ба","Бя","Ня"]; const counts = Array(7).fill(0) as number[]; const now = new Date(); const monday = new Date(now); monday.setHours(0,0,0,0); monday.setDate(now.getDate()-((now.getDay()+6)%7)); for (const attempt of attempts) { const completed = new Date(attempt.completedAt); if (completed < monday) continue; const index = (completed.getDay()+6)%7; counts[index] += attempt.total; } return days.map((day,index)=>({day,count:counts[index]})); }
function currentStreak(attempts: StudentDashboardData["attempts"]) { const activeDays = new Set(attempts.map((attempt)=>localDateKey(new Date(attempt.completedAt)))); const cursor = new Date(); cursor.setHours(0,0,0,0); if (!activeDays.has(localDateKey(cursor))) cursor.setDate(cursor.getDate()-1); let streak = 0; while (activeDays.has(localDateKey(cursor))) { streak += 1; cursor.setDate(cursor.getDate()-1); } return streak; }
function localDateKey(date: Date) { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function firstName(name: string) { return name.trim().split(/\s+/)[0]; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join("") || "С"; }
