import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Clock3, ListChecks } from "lucide-react";
import type { Course, Lesson } from "@/lib/learning/course-catalog";
import { updateLessonProgress } from "@/app/lesson/actions";
import { ProgressRing } from "./progress-ring";

export function LessonReader({ lesson, completedIds, course }: { lesson: Lesson & { moduleId: string; moduleTitle: string }; completedIds: string[]; course: Course }) {
  const courseModule = course.modules.find((item)=>item.id===lesson.moduleId)!;
  const currentIndex = courseModule.lessons.findIndex((item)=>item.id===lesson.id);
  const flat = course.modules.flatMap((item)=>item.lessons);
  const flatIndex = flat.findIndex((item)=>item.id===lesson.id);
  const previous = flat[flatIndex-1];
  const next = flat[flatIndex+1];
  const completed = completedIds.includes(lesson.id);
  const moduleDone = courseModule.lessons.filter((item)=>completedIds.includes(item.id)).length;
  const modulePercent = Math.round((moduleDone/courseModule.lessons.length)*100);
  const markComplete = updateLessonProgress.bind(null, lesson.id, true);

  return <main className="min-h-screen bg-[#f5f6fa] text-[#111735]">
    <div className="border-b bg-white"><div className="container-page flex min-h-16 items-center justify-between gap-4"><Link href="/lesson" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#3151e8]"><ArrowLeft size={17}/>Хөтөлбөр рүү буцах</Link><div className="hidden items-center gap-3 sm:flex"><ProgressRing value={modulePercent} size={44}/><div><p className="text-xs text-slate-500">{courseModule.title}</p><p className="text-sm font-semibold">{moduleDone}/{courseModule.lessons.length} сэдэв</p></div></div></div></div>
    <div className="container-page grid gap-7 py-8 lg:grid-cols-[280px_minmax(0,760px)] lg:justify-center lg:py-12">
      <aside className="order-2 lg:order-1"><div className="rounded-2xl border bg-white p-3 lg:sticky lg:top-24"><div className="p-3"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#8057eb]">Хичээл {course.modules.findIndex((item)=>item.id===courseModule.id)+1}</p><h2 className="mt-1 font-semibold">{courseModule.title}</h2><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#8057eb]" style={{width:`${modulePercent}%`}}/></div></div><nav aria-label="Хичээлийн сэдвүүд" className="mt-2 space-y-1">{courseModule.lessons.map((item,index)=><Link key={item.id} href={`/lesson/${course.slug}/${item.id}`} aria-current={item.id===lesson.id?"page":undefined} className={`flex gap-3 rounded-xl p-3 text-sm ${item.id===lesson.id?"bg-[#eee9ff] text-[#7045df]":"hover:bg-slate-50"}`}><span className={`mt-0.5 ${completedIds.includes(item.id)?"text-emerald-600":"text-slate-400"}`}>{completedIds.includes(item.id)?<CheckCircle2 size={17}/>:<Circle size={17}/>}</span><span><span className="block font-medium">{index+1}. {item.title}</span><span className="mt-1 block text-xs text-slate-400">{item.duration}</span></span></Link>)}</nav></div></aside>
      <article className="order-1 overflow-hidden rounded-2xl border bg-white lg:order-2">
        <header className="border-b px-6 py-7 sm:px-9 sm:py-9"><div className="flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="rounded-full bg-[#eee9ff] px-3 py-1 font-semibold text-[#7045df]">Сэдэв {currentIndex+1}</span><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{lesson.duration}</span></div><h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{lesson.title}</h1><p className="mt-4 text-base leading-7 text-slate-600">{lesson.summary}</p></header>
        <div className="px-6 py-7 sm:px-9 sm:py-9"><section className="rounded-2xl bg-[#f7f5ff] p-5"><h2 className="flex items-center gap-2 font-semibold"><ListChecks size={19} className="text-[#8057eb]"/>Энэ хичээлээр</h2><ul className="mt-4 space-y-2">{lesson.objectives.map((item)=><li key={item} className="flex gap-2 text-sm leading-6 text-slate-700"><Check size={15} className="mt-1 shrink-0 text-[#8057eb]"/>{item}</li>)}</ul></section>
          <div className="mt-9 space-y-10">{lesson.sections.map((section,index)=><section key={section.title}><p className="text-xs font-semibold text-[#8057eb]">{String(index+1).padStart(2,"0")}</p><h2 className="mt-2 text-2xl font-semibold">{section.title}</h2><p className="mt-4 text-[15px] leading-8 text-slate-600">{section.body}</p>{section.example&&<div className="mt-5 rounded-xl border-l-4 border-[#8057eb] bg-slate-50 p-5 font-mono text-sm leading-7 text-slate-700">{section.example}</div>}</section>)}</div>
          <div className="mt-10 border-t pt-7">{completed?<div className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18}/>Сэдэв дууссан</div>:<form action={markComplete}><button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3151e8] px-5 text-sm font-semibold text-white hover:bg-[#2945cc]"><Check size={18}/>Сэдэв дуусгах</button></form>}</div>
        </div>
        <footer className="grid gap-3 border-t bg-slate-50 p-5 sm:grid-cols-2">{previous?<Link href={`/lesson/${course.slug}/${previous.id}`} className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm hover:border-[#8057eb]"><ArrowLeft size={17}/><span><span className="block text-xs text-slate-400">Өмнөх</span><span className="font-semibold">{previous.title}</span></span></Link>:<span/>}{next?<Link href={`/lesson/${course.slug}/${next.id}`} className="flex items-center justify-end gap-3 rounded-xl border bg-white p-4 text-right text-sm hover:border-[#8057eb]"><span><span className="block text-xs text-slate-400">Дараах</span><span className="font-semibold">{next.title}</span></span><ArrowRight size={17}/></Link>:<Link href="/lesson" className="flex items-center justify-center gap-2 rounded-xl bg-[#3151e8] p-4 text-sm font-semibold text-white">Хөтөлбөр харах<ArrowRight size={17}/></Link>}</footer>
      </article>
    </div>
  </main>;
}
