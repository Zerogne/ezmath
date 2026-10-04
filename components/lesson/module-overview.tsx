import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Clock3, Play } from "lucide-react";
import { moduleLessons, type Course, type CourseMainModule, type CourseModule } from "@/lib/learning/course-catalog";
import type { LessonProgress } from "@/lib/data/lesson-progress";
import { ProgressRing } from "./progress-ring";

export function ModuleOverview({ progress, course, main }: { progress: LessonProgress[]; course: Course; main: CourseMainModule }) {
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const lessons = moduleLessons(main);
  const done = lessons.filter((item) => completed.has(item.id)).length;
  const percent = Math.round((done / lessons.length) * 100);
  const recentId = progress.find((item) => !item.completed_at)?.lesson_id;
  const nextLesson = lessons.find((item) => item.id === recentId) ?? lessons.find((item) => !completed.has(item.id));
  const mainIndex = course.modules.findIndex((item) => item.id === main.id);

  return <main className="min-h-screen bg-[#f5f6fa] text-[#111735]">
    <section className="bg-[#0b102e] text-white">
      <div className="container-page py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-400">
          <Link href="/lesson" className="hover:text-white">{course.title}</Link><ChevronRight size={14}/><span className="text-slate-200">{main.title}</span>
        </nav>
        <div className="mt-7 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a98bff]">Модуль {String(mainIndex + 1).padStart(2, "0")}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl lg:text-[44px]">{main.title}</h1>
            {main.description && <p className="mt-4 text-base leading-7 text-slate-400">{main.description}</p>}
            <p className="mt-5 text-sm text-slate-400">{main.submodules.length} дэд модуль · {lessons.length} сэдэв</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <div className="rounded-full bg-white p-1"><ProgressRing value={percent} size={56}/></div>
            <div><p className="text-sm font-semibold">{done}/{lessons.length} сэдэв дууссан</p>
              {nextLesson ? <Link href={`/lesson/${course.slug}/${nextLesson.id}`} className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#3151e8] px-4 text-sm font-semibold text-white hover:bg-[#2945cc]">{done ? "Үргэлжлүүлэх" : "Эхлэх"}<ChevronRight size={15}/></Link> : <p className="mt-1 text-sm font-semibold text-emerald-400">Модуль дууссан!</p>}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="container-page grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:py-14">
      <div className="space-y-4">
        {main.submodules.map((sub, index) => <SubmoduleCard key={sub.id} sub={sub} label={`${mainIndex + 1}.${index + 1}`} completed={completed} courseSlug={course.slug}/>)}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Link href="/lesson" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#3151e8]"><ArrowLeft size={16}/>Бүх модуль</Link>
        <nav aria-label="Модулиуд" className="rounded-2xl border border-[#e1e4ec] bg-white p-2">
          {course.modules.map((item, index) => <Link key={item.id} href={`/lesson/${course.slug}/module/${item.id}`} aria-current={item.id === main.id ? "page" : undefined} className={`flex items-center gap-3 rounded-xl p-3 text-sm ${item.id === main.id ? "bg-[#eee9ff] font-semibold text-[#7045df]" : "hover:bg-slate-50"}`}>
            <span className="w-6 shrink-0 text-xs text-slate-400">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate">{item.title}</span>
          </Link>)}
        </nav>
      </aside>
    </section>
  </main>;
}

function SubmoduleCard({ sub, label, completed, courseSlug }: { sub: CourseModule; label: string; completed: Set<string>; courseSlug: string }) {
  const count = sub.lessons.filter((item) => completed.has(item.id)).length;
  const done = count === sub.lessons.length;
  const started = count > 0;
  return <section id={sub.id} className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white ${started && !done ? "border-[#8057eb] ring-1 ring-[#8057eb]" : "border-[#e1e4ec]"}`}>
    <div className="flex items-center gap-4 p-5 sm:p-6">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold ${done ? "bg-[#8057eb] text-white" : "bg-[#eee9ff] text-[#8057eb]"}`}>{done ? <Check size={18}/> : label}</span>
      <div className="min-w-0 flex-1"><h2 className="font-semibold sm:text-lg">{sub.title}</h2>{sub.description && <p className="mt-1 text-sm text-slate-500">{sub.description}</p>}</div>
      <div className="hidden text-right sm:block"><p className="text-xs text-slate-500">{sub.lessons.length} сэдэв</p><p className={`mt-1 text-xs font-semibold ${done ? "text-emerald-600" : started ? "text-[#8057eb]" : "text-slate-400"}`}>{done ? "Дууссан" : started ? `${count}/${sub.lessons.length} дууссан` : "Эхлээгүй"}</p></div>
    </div>
    <div className="border-t px-4 py-2 sm:px-6">{sub.lessons.map((item) => <Link key={item.id} href={`/lesson/${courseSlug}/${item.id}`} className="group flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-slate-50"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${completed.has(item.id) ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500 group-hover:bg-[#eee9ff] group-hover:text-[#8057eb]"}`}>{completed.has(item.id) ? <Check size={14}/> : <Play size={13} fill="currentColor"/>}</span><span className="min-w-0 flex-1 font-medium">{item.title}</span><span className="flex items-center gap-1 text-xs text-slate-400"><Clock3 size={13}/>{item.duration}</span></Link>)}</div>
  </section>;
}
