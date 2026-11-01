import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, Play } from "lucide-react";
import { moduleLessons, type Course, type LessonInContext } from "@/lib/learning/course-catalog";
import { updateLessonProgress } from "@/app/lesson/actions";
import { Ezi, ObjectArt, type ObjectKind } from "@/components/home/redesign/illustrations";
import { ProgressRing } from "./progress-ring";

const muted = "text-[#5B6275]";
const card = "rounded-[24px] border-2 border-[#EEF0F6] bg-white";
const sectionArt: [ObjectKind, string][] = [["graph", "#FFF6CC"], ["pencil", "#E8EEFF"], ["target", "#E9FBF2"], ["bulb", "#FFF0E6"]];

export function LessonReader({ lesson, completedIds, course }: { lesson: LessonInContext; completedIds: string[]; course: Course }) {
  const mainIndex = course.modules.findIndex((item) => item.id === lesson.moduleId);
  const main = course.modules[mainIndex];
  const subIndex = main.submodules.findIndex((item) => item.id === lesson.submoduleId);
  const submodule = main.submodules[subIndex];
  const currentIndex = submodule.lessons.findIndex((item) => item.id === lesson.id);
  const flat = course.modules.flatMap(moduleLessons);
  const flatIndex = flat.findIndex((item) => item.id === lesson.id);
  const previous = flat[flatIndex - 1];
  const next = flat[flatIndex + 1];
  const completed = completedIds.includes(lesson.id);
  const subDone = submodule.lessons.filter((item) => completedIds.includes(item.id)).length;
  const subPercent = Math.round((subDone / submodule.lessons.length) * 100);
  const moduleHref = `/lesson/${course.slug}/module/${main.id}`;
  const markComplete = updateLessonProgress.bind(null, lesson.id, true);

  return <main className="min-h-screen bg-[#F6F7FB] text-[#0B1030]">
    <div className="border-b-2 border-[#EEF0F6] bg-white"><div className="container-page flex min-h-16 items-center justify-between gap-4">
      <nav aria-label="Breadcrumb" className={`flex min-w-0 items-center gap-1 text-sm ${muted}`}>
        <Link href={moduleHref} className="inline-flex shrink-0 items-center gap-2 font-semibold text-[#0B1030] hover:text-[#7C4DEB]"><ArrowLeft size={17}/><span className="sm:hidden">Буцах</span></Link>
        <Link href="/lesson" className="hidden truncate hover:text-[#0B1030] md:inline">{course.title}</Link><ChevronRight size={14} className="hidden shrink-0 md:block"/>
        <Link href={moduleHref} className="hidden truncate hover:text-[#0B1030] sm:inline">{main.title}</Link><ChevronRight size={14} className="hidden shrink-0 sm:block"/>
        <Link href={`${moduleHref}#${submodule.id}`} className="hidden truncate font-semibold text-[#0B1030] hover:text-[#7C4DEB] sm:inline">{submodule.title}</Link>
      </nav>
      <div className="hidden shrink-0 items-center gap-3 lg:flex"><ProgressRing value={subPercent} size={44}/><div><p className={`text-xs ${muted}`}>{submodule.title}</p><p className="text-sm font-semibold">{subDone}/{submodule.lessons.length} сэдэв</p></div></div>
    </div></div>

    <div className="container-page grid gap-6 py-8 lg:grid-cols-[300px_minmax(0,780px)] lg:justify-center lg:py-10">
      <aside className="order-2 lg:order-1"><div className={`${card} overflow-hidden lg:sticky lg:top-6`}>
        <div className="bg-[#EFE6FF] px-5 py-4"><p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7C4DEB]">Дэд модуль {mainIndex + 1}.{subIndex + 1}</p><h2 className="mt-1 font-sans text-lg font-semibold tracking-normal">{submodule.title}</h2><div className="mt-3 h-1.5 rounded-full bg-white/70"><div className="h-full rounded-full bg-[#7C4DEB]" style={{ width: `${subPercent}%` }}/></div></div>
        <nav aria-label="Дэд модулийн сэдвүүд" className="p-2.5">{submodule.lessons.map((item, index) => {
          const isDone = completedIds.includes(item.id);
          const isCurrent = item.id === lesson.id;
          return <Link key={item.id} href={`/lesson/${course.slug}/${item.id}`} aria-current={isCurrent ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isCurrent ? "bg-[#EFE6FF]" : "hover:bg-[#F8F9FC]"}`}>
            {isDone ? <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#22C55E] text-white"><Check size={12} strokeWidth={3}/></span> : isCurrent ? <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#7C4DEB] text-white"><Play size={8} fill="currentColor"/></span> : <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#E3E6EF] text-[10px] font-semibold text-[#8A90A2]">{index + 1}</span>}
            <span className="min-w-0 flex-1"><span className={`block truncate ${isCurrent ? "font-semibold" : "font-medium"}`}>{item.title}</span><span className={`block text-xs ${muted}`}>{item.duration}</span></span>
          </Link>;
        })}</nav>
      </div></aside>

      <article className={`${card} order-1 overflow-hidden lg:order-2`}>
        <header className="relative bg-gradient-to-b from-[#FBF9FF] to-white px-6 pb-8 pt-8 sm:px-10 sm:pt-10">
          <div className={`flex flex-wrap items-center gap-2 text-xs ${muted}`}><span className="rounded-full bg-[#EFE6FF] px-3 py-1 font-semibold text-[#7C4DEB]">Сэдэв {currentIndex + 1}</span><span className="inline-flex items-center gap-1 rounded-full border-2 border-[#EEF0F6] bg-white px-2.5 py-0.5 font-medium"><Clock3 size={13}/>{lesson.duration}</span></div>
          <h1 className="mt-4 max-w-[560px] text-[34px] font-medium leading-[1.1] tracking-[-0.03em] sm:text-[44px]">{lesson.title}</h1>
          <p className={`mt-4 max-w-[600px] text-[17px] leading-relaxed ${muted}`}>{lesson.summary}</p>
          <Ezi pose="read" size={120} className="absolute bottom-2 right-8 hidden md:block"/>
        </header>
        <div className="px-6 pb-8 sm:px-10 sm:pb-10">
          <section className="rounded-[20px] border-2 border-dashed border-[#DCD3F7] bg-[#FBF9FF] p-5 sm:p-6">
            <h2 className="font-sans text-base font-semibold tracking-normal">Энэ хичээлээр</h2>
            <ul className="mt-3 space-y-2.5">{lesson.objectives.map((item) => <li key={item} className="flex gap-2.5 text-[15px] leading-6"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#7C4DEB] text-white"><Check size={12} strokeWidth={3}/></span>{item}</li>)}</ul>
          </section>
          <div className="mt-10 space-y-11">{lesson.sections.map((section, index) => {
            const [art, bg] = sectionArt[index % sectionArt.length];
            return <section key={section.title}>
              <div className="flex items-center gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px]" style={{ background: bg }}><ObjectArt kind={art} size={44}/></span><div><p className="font-display text-sm font-light text-[#8A90A2]">{String(index + 1).padStart(2, "0")}</p><h2 className="text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[26px]">{section.title}</h2></div></div>
              <p className={`mt-4 text-[16px] leading-[1.8] ${muted}`}>{section.body}</p>
              {section.example && <div className="mt-5 rounded-[18px] border-2 border-[#E8EEFF] bg-[#F7F9FF] p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2B4BE8]">Жишээ</p><p className="mt-2 font-serif text-[17px] leading-relaxed">{section.example}</p></div>}
            </section>;
          })}</div>
          <div className="mt-11 border-t-2 border-[#F4F5FA] pt-7">{completed
            ? <div className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#E9FBF2] text-[15px] font-semibold text-[#15803D]"><Check size={18} strokeWidth={3}/>Сэдэв дууссан</div>
            : <form action={markComplete}><button type="submit" className="btn-dark w-full"><Check size={18}/>Сэдэв дуусгах</button></form>}</div>
        </div>
        <footer className="grid gap-3 border-t-2 border-[#F4F5FA] bg-[#F8F9FC] p-5 sm:grid-cols-2">
          {previous ? <Link href={`/lesson/${course.slug}/${previous.id}`} className="flex items-center gap-3 rounded-[18px] border-2 border-[#EEF0F6] bg-white p-4 text-sm transition hover:border-[#C9BDF5]"><ArrowLeft size={17} className="shrink-0 text-[#7C4DEB]"/><span className="min-w-0"><span className={`block text-xs ${muted}`}>Өмнөх</span><span className="block truncate font-semibold">{previous.title}</span></span></Link> : <span/>}
          {next ? <Link href={`/lesson/${course.slug}/${next.id}`} className="flex items-center justify-end gap-3 rounded-[18px] border-2 border-[#EEF0F6] bg-white p-4 text-right text-sm transition hover:border-[#C9BDF5]"><span className="min-w-0"><span className={`block text-xs ${muted}`}>Дараах</span><span className="block truncate font-semibold">{next.title}</span></span><ArrowRight size={17} className="shrink-0 text-[#7C4DEB]"/></Link>
            : <Link href={moduleHref} className="flex items-center justify-center gap-2 rounded-[18px] bg-[#0B1030] p-4 text-sm font-semibold text-white">Модуль руу буцах<ArrowRight size={17}/></Link>}
        </footer>
      </article>
    </div>
  </main>;
}
