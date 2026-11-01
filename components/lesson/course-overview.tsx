import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { moduleLessons, type Course, type CourseMainModule } from "@/lib/learning/course-catalog";
import type { LessonProgress } from "@/lib/data/lesson-progress";
import { Ezi } from "@/components/home/redesign/illustrations";

export function CourseOverview({ progress, course }: { progress: LessonProgress[]; course: Course }) {
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const lessons = course.modules.flatMap(moduleLessons);
  const total = lessons.length;
  const percent = total ? Math.round((completed.size / total) * 100) : 0;
  const recentId = progress.find((item) => !item.completed_at)?.lesson_id;
  const nextLesson = lessons.find((item) => item.id === recentId) ?? lessons.find((item) => !completed.has(item.id));

  return <main className="min-h-screen bg-[#F7F8FC] text-[#0B1030]">
    <section className="bg-[#0B1030] text-white">
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:py-20">
        <div>
          <h1 className="max-w-3xl text-4xl font-medium leading-[1.08] sm:text-5xl lg:text-[56px]">{course.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">{course.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={nextLesson ? `/lesson/${course.slug}/${nextLesson.id}` : "#modules"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2B4BE8] px-6 text-sm font-semibold text-white hover:bg-[#2440C8]">{completed.size ? "Үргэлжлүүлэн сурах" : "Хөтөлбөр эхлүүлэх"}<ChevronRight size={17}/></Link>
            <Link href="#modules" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-600 px-6 text-sm font-semibold hover:bg-white/5">Хичээлийн жагсаалт</Link>
          </div>
        </div>
        <div className="relative lg:mt-16"><Ezi pose="read" size={130} className="absolute -top-[112px] right-6 hidden lg:block"/><ProgressCard percent={percent} completed={completed.size} total={total} nextLesson={nextLesson} course={course}/></div>
      </div>
    </section>

    <section id="modules" className="container-page scroll-mt-20 py-12 lg:py-16">
      <h2 className="text-3xl font-medium sm:text-[44px]">Хичээлийн бүтэц</h2>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {course.modules.map((main, index) => <MainModuleCard key={main.id} main={main} index={index} completed={completed} courseSlug={course.slug}/>)}
      </div>
    </section>
  </main>;
}

function ProgressCard({percent,completed,total,nextLesson,course}:{percent:number;completed:number;total:number;nextLesson?:{id:string;title:string};course:Course}) { return <div className="rounded-[24px] bg-white p-6 text-[#111735] shadow-2xl shadow-black/20 sm:p-7"><p className="text-lg font-semibold">Таны явц</p><div className="mt-5 flex items-baseline gap-2"><strong className="text-5xl font-semibold text-[#8057eb]">{percent}</strong><span className="text-sm text-slate-500">% дууссан</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#8057eb]" style={{width:`${percent}%`}}/></div><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Дууссан сэдэв</dt><dd className="font-semibold">{completed} / {total}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Нийт модуль</dt><dd className="font-semibold">{course.modules.length}</dd></div></dl>{nextLesson ? <Link href={`/lesson/${course.slug}/${nextLesson.id}`} className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-[#eee9ff] px-4 text-center text-sm font-semibold text-[#7045df] hover:bg-[#e5dcff]">{completed ? "Үргэлжлүүлэх" : "Эхлэх"}: {nextLesson.title}</Link> : <p className="mt-6 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">Хөтөлбөр дууссан!</p>}</div>; }

function MainModuleCard({ main, index, completed, courseSlug }: { main: CourseMainModule; index: number; completed: Set<string>; courseSlug: string }) {
  const lessons = moduleLessons(main);
  const count = lessons.filter((item) => completed.has(item.id)).length;
  const empty = lessons.length === 0;
  const done = !empty && count === lessons.length;
  const started = count > 0;
  const percent = empty ? 0 : Math.round((count / lessons.length) * 100);
  return <Link href={`/lesson/${courseSlug}/module/${main.id}`} className={`group flex flex-col rounded-[22px] border-2 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8057eb]/10 sm:p-6 ${started && !done ? "border-[#8057eb] ring-1 ring-[#8057eb]" : "border-[#e1e4ec] hover:border-[#c9bdf5]"}`}>
    <div className="flex items-start gap-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold ${done ? "bg-[#8057eb] text-white" : "bg-[#eee9ff] text-[#8057eb]"}`}>{done ? <Check size={18}/> : String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1"><h3 className="truncate font-semibold sm:text-lg" title={main.title}>{main.title}</h3><p className="mt-1 line-clamp-2 min-h-12 text-sm leading-6 text-slate-500">{main.description}</p></div>
      <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#8057eb]"/>
    </div>
    <div className="mt-auto pt-6">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-[#8057eb]"}`} style={{ width: `${percent}%` }}/></div>
      <div className="mt-4 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3151e8]">{empty ? "Агуулга удахгүй нэмэгдэнэ" : done ? "Дахин үзэх" : started ? "Үргэлжлүүлэх" : "Хичээл эхлүүлэх"}<ArrowRight size={15}/></span>{started && !done && <span className="text-xs font-semibold text-[#8057eb]">{count}/{lessons.length}</span>}{done && <span className="text-xs font-semibold text-emerald-600">Дууссан</span>}</div>
    </div>
  </Link>;
}
