import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, ListChecks, Play } from "lucide-react";
import { moduleLessons, type Course, type CourseMainModule } from "@/lib/learning/course-catalog";
import type { LessonProgress } from "@/lib/data/lesson-progress";
import { Ezi, ObjectArt, Squiggle } from "@/components/home/redesign/illustrations";
import { ScrollMotion } from "@/components/home/redesign/scroll-motion";
import { PracticeBlock } from "@/components/lesson/practice-block";
import { SubmoduleCard, type Ctx } from "./course-overview";
import { ProgressRing } from "./progress-ring";
import "@/components/home/redesign/redesign.css";

const muted = "text-[#5B6275]";

export function ModuleOverview({ progress, course, main }: { progress: LessonProgress[]; course: Course; main: CourseMainModule }) {
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const lessons = moduleLessons(main);
  const done = lessons.filter((item) => completed.has(item.id)).length;
  const percent = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const recentId = progress.find((item) => !item.completed_at)?.lesson_id;
  const nextLesson = lessons.find((item) => item.id === recentId) ?? lessons.find((item) => !completed.has(item.id));
  const mainIndex = course.modules.findIndex((item) => item.id === main.id);
  const ctx: Ctx = { completed, nextId: nextLesson?.id, slug: course.slug, href: (lesson) => `/lesson/${course.slug}/${lesson.id}` };
  const words = main.title.split(" ");
  const last = words.pop();

  return <main className="rd bg-white text-[#0B1030]">
    <ScrollMotion/>
    <section className="bg-gradient-to-b from-white to-[#F6F2FF]">
      <div className="container-page grid items-center gap-10 pb-14 pt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-[72px] lg:pt-10">
        <div>
          <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1 text-sm ${muted}`}><Link href="/lesson" className="hover:text-[#0B1030]">{course.title}</Link><ChevronRight size={14}/><span className="font-medium text-[#0B1030]">{main.title}</span></nav>
          <span className="mt-6 inline-flex rounded-full bg-[#EFE6FF] px-3 py-1.5 text-[13px] font-semibold text-[#7C4DEB]">Модуль {String(mainIndex + 1).padStart(2, "0")}</span>
          <h1 className="mt-4 text-[40px] font-medium leading-[1.06] tracking-[-0.03em] sm:text-5xl lg:text-[56px]">{words.join(" ")} <Squiggle color="#7C4DEB">{last}</Squiggle></h1>
          {main.description && <p className={`mt-5 max-w-[600px] text-lg leading-relaxed ${muted}`}>{main.description}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#EEF0F6] bg-white px-3.5 py-[7px] text-sm font-medium"><BookOpen size={14} className="text-[#7C4DEB]"/>{main.submodules.length} дэд модуль</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#EEF0F6] bg-white px-3.5 py-[7px] text-sm font-medium"><ListChecks size={14} className="text-[#7C4DEB]"/>{lessons.length} сэдэв</span>
          </div>
        </div>
        <div className="relative lg:mt-20">
          <Ezi pose="point" size={110} className="absolute -top-[96px] right-6 hidden lg:block"/>
          <div className="rounded-[26px] border-2 border-[#EEF0F6] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(11,16,48,.35)]">
            <div className="flex items-center gap-4"><ProgressRing value={percent} size={64}/><div><p className="font-semibold">{done}/{lessons.length} сэдэв дууссан</p><p className={`mt-0.5 text-sm ${muted}`}>{lessons.length ? percent === 100 ? "Модуль дууссан!" : "Энэ модулийн явц" : "Сэдвүүд удахгүй нэмэгдэнэ"}</p></div></div>
            {nextLesson && <Link href={ctx.href(nextLesson)} className="mt-5 flex items-center gap-3 rounded-2xl bg-[#EFE6FF] px-4 py-3.5 transition hover:bg-[#E6DAFF]">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#7C4DEB] text-white"><Play size={12} fill="currentColor"/></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#7C4DEB]">{done ? "ҮРГЭЛЖЛҮҮЛЭХ" : "ЭХНИЙ СЭДЭВ"}</span><span className="mt-0.5 block truncate text-[15px] font-semibold">{nextLesson.title} · {nextLesson.duration}</span></span>
              <ArrowRight size={16} className="shrink-0 text-[#7C4DEB]"/>
            </Link>}
          </div>
        </div>
      </div>
    </section>

    <section className="container-page pb-20 pt-12 lg:pb-24">
      {main.practice && <div className="mb-12 max-w-[760px]">
        <h2 className="text-[28px] font-medium tracking-[-0.03em]">Жишээ ба тест бодлого</h2>
        <p className={`mt-1 text-[15px] ${muted}`}>Модулийн гол санааг жишээгээр хараад, өөрөө бодож шалгаарай.</p>
        <div className="mt-5"><PracticeBlock practice={main.practice}/></div>
      </div>}
      {main.submodules.length ? <div className="grid gap-5 lg:grid-cols-2">{main.submodules.map((sub, index) => <div key={sub.id} id={sub.id} className="scroll-mt-24"><SubmoduleCard sub={sub} index={index} ctx={ctx}/></div>)}</div>
        : <div className="flex flex-col items-center rounded-[22px] border-2 border-dashed border-[#E3E6EF] bg-[#F8F9FC] px-6 py-12 text-center"><Ezi pose="sleep" size={110}/><p className="mt-3 text-lg font-medium">Энэ модулийн агуулга удахгүй нэмэгдэнэ</p><p className={`mt-1 text-sm ${muted}`}>Агуулга нэмэгдэх бүрт энд автоматаар гарч ирнэ.</p></div>}

      {course.modules.length > 1 && <div className="mt-14">
        <h2 className="text-[28px] font-medium tracking-[-0.03em]">Бусад модуль</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{course.modules.filter((item) => item.id !== main.id).map((item) => {
          const count = moduleLessons(item).length;
          return <Link key={item.id} href={`/lesson/${course.slug}/module/${item.id}`} className="flex items-center gap-4 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 transition hover:border-[#C9BDF5]">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#EFE6FF]"><ObjectArt kind="notebook" size={44}/></span>
            <span className="min-w-0"><span className="block truncate font-semibold">{item.title}</span><span className={`mt-0.5 block text-sm ${muted}`}>{item.submodules.length} дэд модуль · {count} сэдэв</span></span>
          </Link>;
        })}</div>
      </div>}
    </section>
  </main>;
}
