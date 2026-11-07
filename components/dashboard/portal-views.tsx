import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, ListChecks, Lock, PenLine } from "lucide-react";
import type { Test } from "@/types/exam";
import type { HistoryAttempt } from "@/lib/data/student-history";
import type { Lesson } from "@/lib/learning/course-catalog";
import { EmptyState } from "@/components/ui/empty-state";
import { Ezi, type ObjectKind } from "@/components/home/redesign/illustrations";
import { ArtTile, btnSmDark, btnSmOutline, Chip, portalCard, portalMuted, SectionTitle } from "@/components/dashboard/portal-ui";

const TYPE_LABEL = { full: "Бүрэн mock", practice: "Дасгал", "previous-year": "Өмнөх оны" } as const;

function testArt(test: Test): [ObjectKind, string] {
  if (test.type === "practice") return ["target", "#EFE6FF"];
  return test.examType === "SAT" ? ["calculator", "#E9FBF2"] : ["notebook", "#E8EEFF"];
}

export function TestGrid({ tests, attempts, action = "Нээх", paid = true }: { tests: Test[]; attempts: HistoryAttempt[]; action?: string; paid?: boolean }) {
  const done = new Map(attempts.map((item) => [item.testId, item]));
  const freeExamUsed = attempts.some((item) => tests.some((test) => test.id === item.testId && test.type !== "practice"));
  if (!tests.length) return <EmptyState className="mt-5" title="Энэ ангилалд нийтлэгдсэн материал алга." pose="sleep"/>;
  return <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{tests.map((test, index) => {
    const result = done.get(test.id);
    const locked = !paid && test.type !== "practice" && (freeExamUsed || index > 0);
    const [art, tile] = testArt(test);
    return <article key={test.id} className={`${portalCard} flex flex-col p-5 ${locked ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <ArtTile kind={art} bg={tile} size={56} art={48}/>
        <div className="flex flex-wrap justify-end gap-1.5"><Chip tone={test.examType === "SAT" ? "amber" : "blue"}>{test.examType === "SAT" ? "SAT" : "ЭЕШ"}</Chip><Chip tone="grey">{TYPE_LABEL[test.type]}</Chip></div>
      </div>
      <h3 className="mt-4 font-sans text-[17px] font-semibold leading-snug tracking-normal">{test.title}</h3>
      {test.description && <p className={`mt-1.5 line-clamp-2 text-sm leading-6 ${portalMuted}`}>{test.description}</p>}
      <div className={`mt-3 flex gap-4 text-xs font-medium ${portalMuted}`}><span className="inline-flex items-center gap-1"><ListChecks size={14}/>{test.questionCount} асуулт</span><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{test.durationMinutes} мин</span></div>
      <div className="mt-auto pt-5">
        {result && !locked && <div className="mb-4"><div className="flex justify-between text-xs"><span className={portalMuted}>Сүүлийн оноо</span><b>{result.score} / {result.maxScore}</b></div><div className="mt-1.5 h-2 rounded-full bg-[#EEF0F6]"><div className="h-full rounded-full bg-[#2B4BE8]" style={{ width: `${result.accuracy}%` }}/></div></div>}
        <Link href={locked ? "/pricing" : `/tests/${test.id}`} className={`${locked || result ? btnSmOutline : btnSmDark} w-full`}>{locked ? <><Lock size={14}/>Багц ахиулах</> : <>{result ? "Дахин өгөх" : action}<ArrowRight size={15}/></>}</Link>
      </div>
    </article>;
  })}</div>;
}

export type CourseProgressSummary = { title: string; description: string; modules: number; lessons: number; exercises: number; completed: number; nextLesson?: Pick<Lesson, "title" | "duration">; href: string };

export function CourseSummary({ course, tests, attempts, paid = true }: { course: CourseProgressSummary; tests: Test[]; attempts: HistoryAttempt[]; paid?: boolean }) {
  const attempted = new Set(attempts.map((item) => item.testId));
  const active = tests.filter((item) => attempted.has(item.id));
  const list = active.length ? active : tests.slice(0, paid ? 3 : 1);
  const percent = course.lessons ? Math.round(course.completed / course.lessons * 100) : 0;
  return <>
    <section className="relative mt-6 overflow-hidden rounded-[22px] border-2 border-[#E6DDFF] bg-[linear-gradient(135deg,#F6F2FF_0%,#EFE6FF_100%)] p-6 sm:p-8">
      <div className="relative z-[1] max-w-[620px]">
        <Chip tone="violet">Онолын хичээл</Chip>
        <h2 className="mt-3 text-[28px] font-medium leading-tight tracking-[-0.03em] sm:text-[34px]">{course.title}</h2>
        <p className={`mt-2 text-[15px] leading-relaxed ${portalMuted}`}>{paid ? course.description : "Багцгүй эрхээр сэдэв бүрийн эхний хичээлийг үзнэ. Бүх хичээлийг нээхийн тулд багц сонгоно уу."}</p>
        <div className="mt-4 flex flex-wrap gap-2"><Chip icon={<BookOpen size={13}/>}>{course.modules} дэд модуль</Chip><Chip icon={<ListChecks size={13}/>}>{course.lessons} сэдэв</Chip><Chip icon={<PenLine size={13}/>}>{course.exercises} дасгал</Chip></div>
        <div className="mt-5 max-w-[420px] rounded-2xl bg-white/80 p-4">
          <div className="flex items-baseline justify-between"><p className="text-sm font-semibold">Таны явц</p><p className="text-sm"><b className="font-display text-xl font-medium text-[#7C4DEB]">{percent}%</b> <span className={portalMuted}>· {course.completed}/{course.lessons}</span></p></div>
          <div className="mt-2 h-2 rounded-full bg-[#E6DDFF]"><div className="h-full rounded-full bg-[#7C4DEB]" style={{ width: `${percent}%` }}/></div>
          {course.nextLesson && <p className={`mt-2.5 text-[13px] ${portalMuted}`}>Дараагийн сэдэв: <b className="text-[#0B1030]">{course.nextLesson.title}</b> · {course.nextLesson.duration}</p>}
        </div>
        <Link href={course.href} className={`${btnSmDark} mt-5`}>{course.completed ? "Үргэлжлүүлэн сурах" : "Хөтөлбөр эхлүүлэх"}<ArrowRight size={15}/></Link>
      </div>
      <Ezi pose="read" size={190} className="absolute -bottom-3 right-8 hidden md:block"/>
    </section>
    <div className="mt-8"><SectionTitle title="Дагалдах сорилууд" text="Хичээлээ бататгах сорил, дасгалууд."/></div>
    <TestGrid tests={list} attempts={attempts} action="Эхлүүлэх" paid={paid}/>
  </>;
}
