import Link from "next/link";
import { ArrowRight, Check, ChevronRight, Layers } from "lucide-react";
import { moduleLessons, type Course, type CourseMainModule } from "@/lib/learning/course-catalog";
import type { LessonProgress } from "@/lib/data/lesson-progress";

export function CourseOverview({ progress, course }: { progress: LessonProgress[]; course: Course }) {
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const lessons = course.modules.flatMap(moduleLessons);
  const total = lessons.length;
  const percent = total ? Math.round((completed.size / total) * 100) : 0;
  const recentId = progress.find((item) => !item.completed_at)?.lesson_id;
  const nextLesson = lessons.find((item) => item.id === recentId) ?? lessons.find((item) => !completed.has(item.id));

  return <main className="min-h-screen bg-[#f5f6fa] text-[#111735]">
    <section className="bg-[#0b102e] text-white">
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:py-20">
        <div>
          <p className="text-sm text-slate-400"><Link href="/dashboard/courses" className="hover:text-white">Миний хичээлүүд</Link><span className="px-2">/</span><span className="text-slate-200">{course.title}</span></p>
          <div className="mt-6 flex flex-wrap gap-2"><Badge>ЦӨМ ХӨТӨЛБӨР</Badge><Badge>{course.level}</Badge></div>
          <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[54px]">{course.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">{course.description}</p>
          <dl className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
            <Stat value={course.modules.length} label="Модуль"/><Stat value={total} label="Сэдэв"/><Stat value={`${course.exerciseCount}+`} label="Дасгал"/><Stat value={course.estimate} label="Үргэлжлэх"/>
          </dl>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={nextLesson ? `/lesson/${course.slug}/${nextLesson.id}` : "#modules"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#3151e8] px-6 text-sm font-semibold text-white hover:bg-[#2945cc]">{completed.size ? "Үргэлжлүүлэн сурах" : "Хөтөлбөр эхлүүлэх"}<ChevronRight size={17}/></Link>
            <Link href="#modules" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 px-6 text-sm font-semibold hover:bg-white/5">Хичээлийн жагсаалт</Link>
          </div>
        </div>
        <ProgressCard percent={percent} completed={completed.size} total={total} nextLesson={nextLesson} course={course}/>
      </div>
    </section>

    <section id="modules" className="container-page grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-16">
      <div>
        <div className="flex items-end justify-between gap-4"><h2 className="text-3xl font-semibold">Хичээлийн бүтэц</h2><p className="text-sm text-slate-500">{course.modules.length} модуль · {total} сэдэв</p></div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {course.modules.map((main, index) => <MainModuleCard key={main.id} main={main} index={index} completed={completed} courseSlug={course.slug}/>)}
        </div>
      </div>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <InfoCard title="Юу сурах вэ"><ul className="space-y-3">{course.outcomes.map((item)=><li key={item} className="flex gap-3 text-sm leading-6"><Check size={16} className="mt-1 shrink-0 text-[#8057eb]"/>{item}</li>)}</ul></InfoCard>
        <InfoCard title="Урьдчилсан шаардлага"><ul className="space-y-3">{course.prerequisites.map((item)=><li key={item} className="flex gap-3 text-sm text-slate-600"><span className="text-slate-400">•</span>{item}</li>)}</ul></InfoCard>
      </aside>
    </section>
  </main>;
}

function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-white/10">{children}</span>; }
function Stat({ value, label }: { value: string | number; label: string }) { return <div><dt className="text-lg font-semibold">{value}</dt><dd className="mt-0.5 text-xs text-slate-500">{label}</dd></div>; }
function ProgressCard({percent,completed,total,nextLesson,course}:{percent:number;completed:number;total:number;nextLesson?:{id:string;title:string};course:Course}) { return <div className="rounded-[24px] bg-white p-6 text-[#111735] shadow-2xl shadow-black/20 sm:p-7"><p className="text-lg font-semibold">Таны явц</p><div className="mt-5 flex items-baseline gap-2"><strong className="text-5xl font-semibold text-[#8057eb]">{percent}</strong><span className="text-sm text-slate-500">% дууссан</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#8057eb]" style={{width:`${percent}%`}}/></div><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Дууссан сэдэв</dt><dd className="font-semibold">{completed} / {total}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Нийт модуль</dt><dd className="font-semibold">{course.modules.length}</dd></div></dl>{nextLesson ? <Link href={`/lesson/${course.slug}/${nextLesson.id}`} className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-[#eee9ff] px-4 text-center text-sm font-semibold text-[#7045df] hover:bg-[#e5dcff]">{completed ? "Үргэлжлүүлэх" : "Эхлэх"}: {nextLesson.title}</Link> : <p className="mt-6 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">Хөтөлбөр дууссан!</p>}</div>; }

function MainModuleCard({ main, index, completed, courseSlug }: { main: CourseMainModule; index: number; completed: Set<string>; courseSlug: string }) {
  const lessons = moduleLessons(main);
  const count = lessons.filter((item) => completed.has(item.id)).length;
  const done = count === lessons.length;
  const started = count > 0;
  const percent = Math.round((count / lessons.length) * 100);
  return <Link href={`/lesson/${courseSlug}/module/${main.id}`} className={`group flex flex-col rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#8057eb]/10 sm:p-6 ${started && !done ? "border-[#8057eb] ring-1 ring-[#8057eb]" : "border-[#e1e4ec] hover:border-[#c9bdf5]"}`}>
    <div className="flex items-start gap-4">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold ${done ? "bg-[#8057eb] text-white" : "bg-[#eee9ff] text-[#8057eb]"}`}>{done ? <Check size={18}/> : String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1"><h3 className="font-semibold sm:text-lg">{main.title}</h3>{main.description && <p className="mt-1 text-sm leading-6 text-slate-500">{main.description}</p>}</div>
      <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#8057eb]"/>
    </div>
    <ul className="mt-5 flex flex-wrap gap-2">{main.submodules.map((sub) => <li key={sub.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{sub.title}</li>)}</ul>
    <div className="mt-auto pt-5">
      <div className="flex items-center justify-between text-xs"><span className="inline-flex items-center gap-1.5 text-slate-500"><Layers size={13}/>{main.submodules.length} дэд модуль · {lessons.length} сэдэв</span><span className={`font-semibold ${done ? "text-emerald-600" : started ? "text-[#8057eb]" : "text-slate-400"}`}>{done ? "Дууссан" : started ? `${count}/${lessons.length}` : "Эхлээгүй"}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-[#8057eb]"}`} style={{ width: `${percent}%` }}/></div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3151e8]">{done ? "Дахин үзэх" : started ? "Үргэлжлүүлэх" : "Модуль нээх"}<ArrowRight size={15}/></span>
    </div>
  </Link>;
}
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#e1e4ec] bg-white p-5"><h2 className="mb-4 text-lg font-semibold">{title}</h2>{children}</section>; }
