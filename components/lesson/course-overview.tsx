import Link from "next/link";
import { Check, ChevronRight, Clock3, Play, UserRound } from "lucide-react";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import type { LessonProgress } from "@/lib/data/lesson-progress";

export function CourseOverview({ progress }: { progress: LessonProgress[] }) {
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const total = coreMathCourse.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const percent = Math.round((completed.size / total) * 100);
  const recentId = progress.find((item) => !item.completed_at)?.lesson_id;
  const nextLesson = coreMathCourse.modules.flatMap((module) => module.lessons).find((item) => item.id === recentId)
    ?? coreMathCourse.modules.flatMap((module) => module.lessons).find((item) => !completed.has(item.id));

  return <main className="min-h-screen bg-[#f5f6fa] text-[#111735]">
    <section className="bg-[#0b102e] text-white">
      <div className="container-page grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:py-20">
        <div>
          <p className="text-sm text-slate-400"><Link href="/dashboard/courses" className="hover:text-white">Хөтөлбөр</Link><span className="px-2">/</span><span className="text-slate-200">{coreMathCourse.title}</span></p>
          <div className="mt-6 flex flex-wrap gap-2"><Badge>ЦӨМ ХӨТӨЛБӨР</Badge><Badge>{coreMathCourse.level}</Badge></div>
          <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[54px]">{coreMathCourse.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">{coreMathCourse.description}</p>
          <dl className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
            <Stat value={coreMathCourse.modules.length} label="Модуль"/><Stat value={total} label="Хичээл"/><Stat value={`${coreMathCourse.exerciseCount}+`} label="Дасгал"/><Stat value={coreMathCourse.estimate} label="Үргэлжлэх"/>
          </dl>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={nextLesson ? `/lesson/${nextLesson.id}` : "#modules"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#3151e8] px-6 text-sm font-semibold text-white hover:bg-[#2945cc]">{completed.size ? "Үргэлжлүүлэн сурах" : "Хөтөлбөр эхлүүлэх"}<ChevronRight size={17}/></Link>
            <Link href="#modules" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 px-6 text-sm font-semibold hover:bg-white/5">Хичээлийн жагсаалт</Link>
          </div>
        </div>
        <ProgressCard percent={percent} completed={completed.size} total={total} nextLesson={nextLesson}/>
      </div>
    </section>

    <section id="modules" className="container-page grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-16">
      <div>
        <div className="flex items-end justify-between gap-4"><h2 className="text-3xl font-semibold">Хөтөлбөрийн бүтэц</h2><p className="text-sm text-slate-500">{coreMathCourse.modules.length} модуль · {total} хичээл</p></div>
        <div className="mt-7 space-y-4">
          {coreMathCourse.modules.map((module, index) => <ModuleCard key={module.id} module={module} index={index} completed={completed}/>) }
        </div>
      </div>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <InfoCard title="Юу сурах вэ"><ul className="space-y-3">{coreMathCourse.outcomes.map((item)=><li key={item} className="flex gap-3 text-sm leading-6"><Check size={16} className="mt-1 shrink-0 text-[#8057eb]"/>{item}</li>)}</ul></InfoCard>
        <InfoCard title="Багш"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full bg-[#eee9ff] text-[#8057eb]"><UserRound/></span><div><p className="font-semibold">{coreMathCourse.instructor.name}</p><p className="text-xs text-slate-500">{coreMathCourse.instructor.role}</p></div></div><p className="mt-4 text-sm leading-6 text-slate-600">{coreMathCourse.instructor.bio}</p></InfoCard>
        <InfoCard title="Урьдчилсан шаардлага"><ul className="space-y-3">{coreMathCourse.prerequisites.map((item)=><li key={item} className="flex gap-3 text-sm text-slate-600"><span className="text-slate-400">•</span>{item}</li>)}</ul></InfoCard>
      </aside>
    </section>
  </main>;
}

function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-white/10">{children}</span>; }
function Stat({ value, label }: { value: string | number; label: string }) { return <div><dt className="text-lg font-semibold">{value}</dt><dd className="mt-0.5 text-xs text-slate-500">{label}</dd></div>; }
function ProgressCard({percent,completed,total,nextLesson}:{percent:number;completed:number;total:number;nextLesson?:{id:string;title:string}}) { return <div className="rounded-[24px] bg-white p-6 text-[#111735] shadow-2xl shadow-black/20 sm:p-7"><p className="text-lg font-semibold">Таны явц</p><div className="mt-5 flex items-baseline gap-2"><strong className="text-5xl font-semibold text-[#8057eb]">{percent}</strong><span className="text-sm text-slate-500">% дууссан</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#8057eb]" style={{width:`${percent}%`}}/></div><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Дууссан хичээл</dt><dd className="font-semibold">{completed} / {total}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Нийт модуль</dt><dd className="font-semibold">{coreMathCourse.modules.length}</dd></div></dl>{nextLesson ? <Link href={`/lesson/${nextLesson.id}`} className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-[#eee9ff] px-4 text-center text-sm font-semibold text-[#7045df] hover:bg-[#e5dcff]">{completed ? "Үргэлжлүүлэх" : "Эхлэх"}: {nextLesson.title}</Link> : <p className="mt-6 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">Хөтөлбөр дууссан!</p>}</div>; }

function ModuleCard({ module, index, completed }: { module: typeof coreMathCourse.modules[number]; index: number; completed: Set<string> }) {
  const count = module.lessons.filter((item)=>completed.has(item.id)).length;
  const done = count === module.lessons.length;
  const started = count > 0;
  return <section className={`overflow-hidden rounded-2xl border bg-white ${started && !done ? "border-[#8057eb] ring-1 ring-[#8057eb]" : "border-[#e1e4ec]"}`}>
    <div className="flex items-center gap-4 p-5 sm:p-6"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-semibold ${done ? "bg-[#8057eb] text-white" : "bg-[#eee9ff] text-[#8057eb]"}`}>{done?<Check size={18}/>:String(index+1).padStart(2,"0")}</span><div className="min-w-0 flex-1"><h3 className="font-semibold sm:text-lg">{module.title}</h3><p className="mt-1 text-sm text-slate-500">{module.description}</p></div><div className="hidden text-right sm:block"><p className="text-xs text-slate-500">{module.lessons.length} хичээл</p><p className={`mt-1 text-xs font-semibold ${done?"text-emerald-600":started?"text-[#8057eb]":"text-slate-400"}`}>{done?"Дууссан":started?`${count}/${module.lessons.length} дууссан`:"Эхлээгүй"}</p></div></div>
    <div className="border-t px-4 py-2 sm:px-6">{module.lessons.map((item)=><Link key={item.id} href={`/lesson/${item.id}`} className="group flex min-h-12 items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-slate-50"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${completed.has(item.id)?"bg-emerald-50 text-emerald-600":"bg-slate-100 text-slate-500 group-hover:bg-[#eee9ff] group-hover:text-[#8057eb]"}`}>{completed.has(item.id)?<Check size={14}/>:<Play size={13} fill="currentColor"/>}</span><span className="min-w-0 flex-1 font-medium">{item.title}</span><span className="flex items-center gap-1 text-xs text-slate-400"><Clock3 size={13}/>{item.duration}</span></Link>)}</div>
  </section>;
}
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#e1e4ec] bg-white p-5"><h2 className="mb-4 text-lg font-semibold">{title}</h2>{children}</section>; }
