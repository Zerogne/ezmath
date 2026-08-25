import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Layers3, Sparkles } from "lucide-react";
import type { LessonProgress } from "@/lib/data/lesson-progress";
import { coreMathCourse } from "@/lib/learning/course-catalog";

export function ProgramCatalog({ progress }: { progress: LessonProgress[] }) {
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const lessonCount = coreMathCourse.modules.reduce((sum, item) => sum + item.lessons.length, 0);
  const percent = Math.round((completed.size / lessonCount) * 100);

  return <main className="min-h-[calc(100vh-79px)] bg-[#f5f6fa] text-[#111735]">
    <section className="border-b bg-white">
      <div className="container-page py-12 sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eee9ff] px-3 py-1.5 text-xs font-semibold text-[#7045df]"><Sparkles size={14}/>СУРАЛЦАХ ХӨТӨЛБӨРҮҮД</span>
        <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Юу сурахаа сонгоорой</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Өөрийн зорилгод тохирох хөтөлбөрөө сонгоод модуль, хичээлүүд болон суралцах явцаа дэлгэрэнгүй хараарай.</p>
      </div>
    </section>

    <section className="container-page py-10 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#8057eb]">ТАНД ЗОРИУЛСАН</p><h2 className="mt-1 text-2xl font-semibold">Хөтөлбөрүүд</h2></div><p className="text-sm text-slate-500">1 хөтөлбөр</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="group overflow-hidden rounded-3xl border border-[#dfe3ed] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="relative bg-[#0b102e] p-7 text-white sm:p-9">
            <div className="absolute right-7 top-7 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-violet-300"><BookOpen size={25}/></div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/10">ЦӨМ ХӨТӨЛБӨР</span>
            <h3 className="mt-7 max-w-md text-3xl font-semibold leading-tight">{coreMathCourse.title}</h3>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400">{coreMathCourse.description}</p>
          </div>
          <div className="p-6 sm:p-7">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Metric icon={<Layers3 size={16}/>} value={coreMathCourse.modules.length} label="Модуль"/>
              <Metric icon={<BookOpen size={16}/>} value={lessonCount} label="Хичээл"/>
              <Metric icon={<Clock3 size={16}/>} value={coreMathCourse.estimate} label="Хугацаа"/>
            </div>
            {completed.size > 0 && <div className="mt-6"><div className="flex justify-between text-xs"><span className="inline-flex items-center gap-1.5 font-medium text-slate-600"><CheckCircle2 size={14} className="text-emerald-600"/>Таны явц</span><strong>{percent}%</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#8057eb]" style={{width:`${percent}%`}}/></div></div>}
            <Link href={`/lesson/${coreMathCourse.slug}`} className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#3151e8] px-5 text-sm font-semibold text-white hover:bg-[#2945cc]">{completed.size ? "Хөтөлбөр үргэлжлүүлэх" : "Хөтөлбөр сонгох"}<ArrowRight size={17}/></Link>
          </div>
        </article>

        <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-[#cfd4e2] bg-white/50 p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm"><BookOpen size={21}/></span><p className="mt-4 font-semibold text-slate-600">Шинэ хөтөлбөрүүд удахгүй</p><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">SAT, ЭЕШ болон олимпиадын тусгай хөтөлбөрүүд энд нэмэгдэнэ.</p></div></div>
      </div>
    </section>
  </main>;
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-1.5 text-slate-500">{icon}{label}</span><strong className="mt-1.5 block truncate text-[#111735]">{value}</strong></div>;
}
