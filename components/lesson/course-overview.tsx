import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, BookOpen, Check, Clock3, PenLine, Play } from "lucide-react";
import { moduleLessons, type Course, type CourseMainModule, type CourseModule, type Lesson } from "@/lib/learning/course-catalog";
import type { LessonProgress } from "@/lib/data/lesson-progress";
import { Art, Cloud, Ezi, ObjectArt, ProductScene, Squiggle, type ObjectKind } from "@/components/home/redesign/illustrations";
import { ScrollMotion } from "@/components/home/redesign/scroll-motion";
import "@/components/home/redesign/redesign.css";

const VIOLET = "#7C4DEB";
const muted = "text-[#5B6275]";
const card = "rounded-[24px] border-2 border-[#EEF0F6] bg-white";
const display = "font-display font-medium tracking-[-0.03em]";

const outcomeArt: [ObjectKind, string][] = [["notebook", "#EFE6FF"], ["protractor", "#E8EEFF"], ["bulb", "#FFF0E6"], ["scorecard", "#E9FBF2"]];
const submoduleArt: [ObjectKind, string][] = [["notebook", "#EFE6FF"], ["protractor", "#E9FBF2"], ["calculator", "#E8EEFF"], ["chart", "#FFE8EF"]];
const steps: { title: string; text: string; art: ObjectKind; bg: string; tilt: number }[] = [
  { title: "Үндсэн санаа", text: "Тодорхойлолтыг жишээ болон эсрэг жишээгээр ойлгоно.", art: "graph", bg: "#FFF6CC", tilt: -6 },
  { title: "Ажилласан жишээ", text: "Нөхцөлийг хэсэгчлэн, алхам бүрийн үндэслэлийг бичнэ.", art: "pencil", bg: "#E8EEFF", tilt: 5 },
  { title: "Өөрийгөө шалгах", text: "Өөр утга, эсрэг нөхцөл дээр туршиж, хариугаа нягтална.", art: "target", bg: "#E9FBF2", tilt: -4 },
];

type Ctx = { completed: Set<string>; nextId?: string; slug: string; href: (lesson: Lesson) => string };

export function CourseOverview({ progress, course }: { progress: LessonProgress[]; course: Course }) {
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const lessons = course.modules.flatMap(moduleLessons);
  const total = lessons.length;
  const done = lessons.filter((item) => completed.has(item.id)).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const recentId = progress.find((item) => !item.completed_at)?.lesson_id;
  const nextLesson = lessons.find((item) => item.id === recentId) ?? lessons.find((item) => !completed.has(item.id));
  const ctx: Ctx = { completed, nextId: nextLesson?.id, slug: course.slug, href: (lesson) => `/lesson/${course.slug}/${lesson.id}` };
  const continueHref = nextLesson ? ctx.href(nextLesson) : "#modules";
  const continueLabel = done ? "Үргэлжлүүлэн сурах" : "Хөтөлбөр эхлүүлэх";
  const words = course.title.split(" ");
  const lastWord = words.pop();

  return <main className="rd bg-white text-[#0B1030]">
    <ScrollMotion/>

    <section className="bg-gradient-to-b from-white to-[#F6F2FF]">
      <div className="container-page grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[minmax(0,648px)_minmax(0,520px)] lg:justify-between lg:pb-[88px] lg:pt-12">
        <div>
          <span className="inline-flex rounded-full bg-[#EFE6FF] px-3 py-1.5 text-[13px] font-semibold text-[#7C4DEB]">Онолын хичээл</span>
          <h1 className="mt-5 text-[42px] font-medium leading-[1.06] tracking-[-0.03em] sm:text-[56px] lg:text-[64px]">{words.join(" ")} <Squiggle color={VIOLET}>{lastWord}</Squiggle></h1>
          <p className={`mt-[22px] max-w-[600px] text-lg leading-[1.6] lg:text-xl ${muted}`}>{course.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Chip icon={<BarChart3 size={14}/>}>{course.level}</Chip>
            <Chip icon={<Clock3 size={14}/>}>{course.estimate}</Chip>
            <Chip icon={<BookOpen size={14}/>}>{total} сэдэв</Chip>
            <Chip icon={<PenLine size={14}/>}>{course.exerciseCount} дасгал</Chip>
          </div>
          <div className="mt-[30px] flex flex-wrap gap-2.5">
            <Link href={continueHref} className="btn-dark">{continueLabel}<ArrowRight size={16}/></Link>
            <Link href="#modules" className="btn-outline">Хичээлийн жагсаалт</Link>
          </div>
        </div>
        <HeroVisual percent={percent} done={done} total={total} modules={course.modules.length} nextLesson={nextLesson} href={nextLesson ? ctx.href(nextLesson) : undefined}/>
      </div>
    </section>

    <section className="container-page pt-20 lg:pt-24">
      <h2 className={`${display} text-center text-[34px] leading-[1.1] sm:text-[44px] lg:text-[56px]`}>Энэ хөтөлбөрөөр юу <Squiggle color={VIOLET}>сурах</Squiggle> вэ?</h2>
      <div className="mt-12 grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {course.outcomes.map((outcome, index) => {
          const [art, bg] = outcomeArt[index % outcomeArt.length];
          return <div key={outcome} className={`${card} flex flex-col gap-4 p-6`}>
            <span className="grid h-[76px] w-[76px] place-items-center rounded-[22px]" style={{ background: bg }}><ObjectArt kind={art} size={72}/></span>
            <p className="text-[17px] font-semibold leading-[1.4]">{outcome}</p>
          </div>;
        })}
      </div>
      {course.prerequisites.length > 0 && <div className="mt-[18px] flex flex-wrap items-center gap-x-[18px] gap-y-3 rounded-[20px] border-2 border-dashed border-[#DCD3F7] bg-[#FBF9FF] px-6 py-[18px]">
        <p className="text-[15px] font-semibold">Өмнө нь мэдэх хэрэгтэй:</p>
        <div className="flex flex-wrap gap-2">{course.prerequisites.map((item) => <Chip key={item}>{item}</Chip>)}</div>
      </div>}
    </section>

    <div id="modules" className="scroll-mt-20">
      {course.modules.map((main, index) => <MainModuleSection key={main.id} main={main} index={index} ctx={ctx}/>)}
      <div className="container-page pt-5">
        <div className="flex items-center gap-4 rounded-[20px] border-2 border-dashed border-[#E3E6EF] bg-[#F8F9FC] px-6 py-4">
          <Ezi pose="sleep" size={56} className="shrink-0"/>
          <div><p className="text-[15px] font-semibold">Шинэ модулиуд удахгүй нэмэгдэнэ</p><p className={`mt-0.5 text-[13px] ${muted}`}>Агуулга нэмэгдэх бүрт энд автоматаар гарч ирнэ.</p></div>
        </div>
      </div>
    </div>

    <section className="container-page pt-24 lg:pt-[110px]">
      <h2 className={`${display} text-center text-[34px] leading-[1.1] sm:text-[44px] lg:text-[56px]`}>Сэдэв бүр <Squiggle color={VIOLET}>3 алхамтай</Squiggle></h2>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {steps.map((step, index) => <div key={step.title} className={`${card} overflow-hidden`}>
          <div className="relative grid h-[150px] place-items-center" style={{ background: step.bg }}>
            <span className={`${display} absolute left-[18px] top-4 text-[30px] font-light text-[#8A90A2]`}>{String(index + 1).padStart(2, "0")}</span>
            <span className="grid h-24 w-24 place-items-center rounded-[28px] bg-white shadow-[0_14px_30px_-12px_rgba(11,16,48,.3)]" style={{ rotate: `${step.tilt}deg` }}><ObjectArt kind={step.art} size={72}/></span>
          </div>
          <div className="px-6 pb-[26px] pt-[22px]">
            <h3 className="text-[22px] font-medium tracking-[-0.03em]">{step.title}</h3>
            <p className={`mt-2 text-[15px] leading-[1.55] ${muted}`}>{step.text}</p>
          </div>
        </div>)}
      </div>
    </section>

    <section className="container-page pt-24 lg:pt-[110px]">
      <div className="grid items-center gap-6 rounded-[24px] border-2 border-[#EDE6FF] bg-[#FBF9FF] px-6 py-8 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-9 sm:px-10 sm:py-9">
        <span className="grid h-[150px] w-[150px] place-items-end justify-center overflow-hidden rounded-full border-4 border-white bg-[#EFE6FF] shadow-[0_16px_34px_-16px_rgba(124,77,235,.5)]"><Art name="friend-violet" size={140}/></span>
        <div>
          <span className="inline-flex rounded-full bg-[#EFE6FF] px-3 py-1.5 text-[13px] font-semibold text-[#7C4DEB]">Багш</span>
          <h2 className="mt-3 text-[30px] font-medium tracking-[-0.03em] sm:text-[34px]">{course.instructor.name}</h2>
          <p className="mt-1 text-[15px] font-semibold text-[#7C4DEB]">{course.instructor.role}</p>
          <p className={`mt-3 max-w-[700px] text-[17px] leading-[1.6] ${muted}`}>{course.instructor.bio}</p>
        </div>
      </div>
    </section>

    <section className="relative mt-[120px] overflow-hidden bg-[linear-gradient(180deg,#F6F2FF_0%,#E8E0FF_55%,#C3F0E2_100%)] pb-[340px] pt-24" data-parallax>
      <Cloud className="rd-cloud" style={{ left: "4%", top: 60, width: 260, opacity: 0.9 }}/>
      <Cloud className="rd-cloud" style={{ left: "78%", top: 40, width: 300, opacity: 0.9 }}/>
      <Cloud className="rd-cloud" style={{ left: "57%", top: 180, width: 180, opacity: 0.6 }}/>
      <div className="container-page relative z-[2] text-center">
        <h2 className={`${display} text-[34px] leading-[1.1] sm:text-5xl lg:text-[56px]`}>Өнөөдөр 15 минут —<br/><Squiggle color={VIOLET}>нэг сэдэв</Squiggle> дуусга</h2>
        <p className={`mt-[18px] text-lg lg:text-[19px] ${muted}`}>{nextLesson ? `Таны дараагийн сэдэв: ${nextLesson.title} · ${nextLesson.duration}` : "Та бүх сэдвийг дуусгасан байна. Дахин давтаж бататгаарай!"}</p>
        <div className="mt-[30px] flex flex-wrap justify-center gap-2.5">
          <Link href={continueHref} className="btn-dark">{continueLabel}<ArrowRight size={16}/></Link>
          <Link href="/dashboard" className="btn-outline">Явцын тайлан</Link>
        </div>
      </div>
      <ProductScene/>
    </section>
  </main>;
}

function Chip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#EEF0F6] bg-white px-3.5 py-[7px] text-sm font-medium">{icon && <span className="text-[#7C4DEB]">{icon}</span>}{children}</span>;
}

function Tile({ art, bg, tilt, className }: { art: ObjectKind; bg: string; tilt: number; className: string }) {
  return <span className={`absolute grid h-[104px] w-[104px] place-items-center rounded-[30px] border-2 border-[rgba(11,16,48,.06)] shadow-[0_16px_34px_-14px_rgba(11,16,48,.28)] ${className}`} style={{ background: bg, rotate: `${tilt}deg` }}><ObjectArt kind={art} size={72}/></span>;
}

function HeroVisual({ percent, done, total, modules, nextLesson, href }: { percent: number; done: number; total: number; modules: number; nextLesson?: Lesson; href?: string }) {
  return <div className="relative mx-auto w-full max-w-[520px] sm:h-[500px]">
    <svg viewBox="0 0 500 480" className="absolute left-[10px] top-[10px] hidden h-[480px] w-[500px] sm:block" aria-hidden><path d="M262 18c86-10 170 30 206 104 36 75 24 170-30 236-55 67-150 106-238 94C112 440 34 380 16 300-2 220 32 128 96 74 140 36 196 26 262 18Z" fill="#EDE6FF"/><circle cx="420" cy="420" r="46" fill="#E2F7EE"/></svg>
    <Tile art="target" bg="#EFE6FF" tilt={-8} className="left-[10px] top-[10px] hidden sm:grid"/>
    <Tile art="graph" bg="#FFF6CC" tilt={9} className="left-[416px] top-10 hidden sm:grid"/>
    <Tile art="protractor" bg="#E9FBF2" tilt={6} className="left-0 top-[376px] hidden sm:grid"/>
    <div className="relative rounded-[26px] border-2 border-[#EEF0F6] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(11,16,48,.35)] sm:absolute sm:left-[90px] sm:top-24 sm:w-[340px]">
      <p className="font-semibold">Таны явц</p>
      <p className="mt-3 flex items-baseline gap-1"><span className={`${display} text-[56px] leading-none text-[#7C4DEB]`}>{percent}</span><span className={`text-sm ${muted}`}>% дууссан</span></p>
      <div className="mt-4 h-2 rounded-full bg-[#EEF0F6]"><div className="h-full rounded-full bg-[#7C4DEB]" style={{ width: `${percent}%` }}/></div>
      <dl className="mt-[18px] space-y-2.5 text-sm">
        <div className="flex justify-between"><dt className={muted}>Дууссан сэдэв</dt><dd className="font-bold">{done} / {total}</dd></div>
        <div className="flex justify-between"><dt className={muted}>Нийт модуль</dt><dd className="font-bold">{modules}</dd></div>
      </dl>
      {nextLesson && href ? <Link href={href} className="mt-5 flex items-center gap-3 rounded-2xl bg-[#EFE6FF] px-4 py-3.5 transition hover:bg-[#E6DAFF]">
        <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#7C4DEB] text-white"><Play size={12} fill="currentColor"/></span>
        <span className="min-w-0"><span className="block text-xs font-semibold text-[#7C4DEB]">ДАРААГИЙН СЭДЭВ</span><span className="mt-0.5 block text-[15px] font-semibold">{nextLesson.title} · {nextLesson.duration}</span></span>
      </Link> : <p className="mt-5 rounded-2xl bg-[#E9FBF2] px-4 py-3.5 text-center text-[15px] font-semibold text-[#15803D]">Хөтөлбөр дууссан!</p>}
    </div>
    <Ezi pose="read" size={130} className="absolute right-0 top-[-60px] sm:left-[386px] sm:right-auto sm:top-[370px]"/>
  </div>;
}

function MainModuleSection({ main, index, ctx }: { main: CourseMainModule; index: number; ctx: Ctx }) {
  const lessons = moduleLessons(main);
  const count = lessons.filter((item) => ctx.completed.has(item.id)).length;
  const next = lessons.find((item) => item.id === ctx.nextId) ?? lessons.find((item) => !ctx.completed.has(item.id));
  const percent = lessons.length ? count / lessons.length : 0;
  return <section className="container-page pt-24 lg:pt-[110px]">
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <span className="inline-flex rounded-full bg-[#EFE6FF] px-2.5 py-1 text-xs font-semibold text-[#7C4DEB]">Модуль {String(index + 1).padStart(2, "0")}</span>
        <h2 className="mt-3 text-[34px] font-medium leading-[1.1] tracking-[-0.03em] sm:text-[44px]"><Link href={`/lesson/${ctx.slug}/module/${main.id}`} className="hover:text-[#7C4DEB]">{main.title}</Link></h2>
        <p className={`mt-2.5 text-[15px] sm:text-base ${muted}`}>{[main.description, `${main.submodules.length} дэд модуль`, `${lessons.length} сэдэв`].filter(Boolean).join(" · ")}</p>
      </div>
      {lessons.length > 0 && <div className="flex items-center gap-3.5 rounded-[20px] border-2 border-[#EEF0F6] bg-white px-[18px] py-3.5">
        <Ring value={percent}/>
        <div><p className="text-[15px] font-semibold">{count}/{lessons.length} сэдэв дууссан</p><p className={`mt-0.5 text-[13px] ${muted}`}>{next ? `Дараагийнх: ${next.title}` : "Модуль дууссан"}</p></div>
      </div>}
    </div>
    {main.submodules.length ? <div className="mt-8 grid gap-5 lg:grid-cols-2">
      {main.submodules.map((sub, subIndex) => <SubmoduleCard key={sub.id} sub={sub} index={subIndex} ctx={ctx}/>)}
    </div> : <p className={`mt-8 rounded-[20px] border-2 border-dashed border-[#E3E6EF] bg-[#F8F9FC] px-6 py-5 text-[15px] ${muted}`}>Энэ модулийн агуулга удахгүй нэмэгдэнэ.</p>}
  </section>;
}

function Ring({ value }: { value: number }) {
  const r = 18, c = 2 * Math.PI * r;
  return <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90" aria-hidden><circle cx="22" cy="22" r={r} fill="none" stroke="#EEF0F6" strokeWidth="5"/><circle cx="22" cy="22" r={r} fill="none" stroke="#7C4DEB" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)}/></svg>;
}

function SubmoduleCard({ sub, index, ctx }: { sub: CourseModule; index: number; ctx: Ctx }) {
  const [art, bg] = submoduleArt[index % submoduleArt.length];
  const count = sub.lessons.filter((item) => ctx.completed.has(item.id)).length;
  const empty = sub.lessons.length === 0;
  const done = !empty && count === sub.lessons.length;
  const current = sub.lessons.some((item) => item.id === ctx.nextId);
  const started = count > 0 || current;
  const target = sub.lessons.find((item) => item.id === ctx.nextId) ?? sub.lessons.find((item) => !ctx.completed.has(item.id)) ?? sub.lessons[0];
  const badge = done ? ["Дууссан", "bg-[#DCFCE7] text-[#15803D]"] : started ? [`${count}/${sub.lessons.length} сэдэв`, "bg-[#EFE6FF] text-[#7C4DEB]"] : [empty ? "Удахгүй" : "Эхлээгүй", "bg-white/70 text-[#5B6275]"];

  return <div className={`flex flex-col overflow-hidden rounded-[24px] border-2 bg-white ${current ? "border-[#7C4DEB] shadow-[0_0_0_1px_#7C4DEB]" : "border-[#EEF0F6]"}`}>
    <div className="relative flex items-center gap-4 px-[18px] py-5 sm:px-6" style={{ background: bg }}>
      <span className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-[22px] bg-white shadow-[0_12px_26px_-14px_rgba(11,16,48,.35)]"><ObjectArt kind={art} size={56}/></span>
      <div className="min-w-0 pr-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5B6275]">Дэд модуль {String(index + 1).padStart(2, "0")}</p>
        <h3 className="mt-1 text-[22px] font-medium leading-tight tracking-[-0.02em]">{sub.title}</h3>
        {sub.description && <p className={`mt-1 text-[13px] ${muted}`}>{sub.description}</p>}
      </div>
      <span className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge[1]}`}>{badge[0]}</span>
    </div>
    <ol className="flex-1 px-[18px] pt-2">
      {empty && <li className={`py-6 text-center text-sm ${muted}`}>Агуулга удахгүй нэмэгдэнэ</li>}
      {sub.lessons.map((lesson, lessonIndex) => {
        const isDone = ctx.completed.has(lesson.id);
        const isNext = lesson.id === ctx.nextId;
        return <li key={lesson.id} className="border-b-2 border-[#F2F3F8] py-1 last:border-b-0">
          <Link href={ctx.href(lesson)} className={`flex items-center gap-3 rounded-xl px-2 py-2.5 transition ${isNext ? "bg-[#EFE6FF]" : "hover:bg-[#F8F9FC]"}`}>
            {isDone ? <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#22C55E] text-white"><Check size={12} strokeWidth={3}/></span>
              : isNext ? <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#7C4DEB] text-white"><Play size={8} fill="currentColor"/></span>
              : <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-[#E3E6EF] text-[10px] font-semibold text-[#8A90A2]">{lessonIndex + 1}</span>}
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span>
            {isNext ? <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#7C4DEB]">Үргэлжлүүлэх<ArrowRight size={13}/></span> : <span className={`shrink-0 text-xs ${muted}`}>{lesson.duration}</span>}
          </Link>
        </li>;
      })}
    </ol>
    {!empty && <div className="flex items-center gap-4 px-[18px] pb-[18px] pt-3 sm:px-6">
      <div className="h-1.5 flex-1 rounded-full bg-[#EEF0F6]"><div className={`h-full rounded-full ${done ? "bg-[#22C55E]" : "bg-[#7C4DEB]"}`} style={{ width: `${(count / sub.lessons.length) * 100}%` }}/></div>
      <Link href={ctx.href(target)} className={started && !done ? "inline-flex h-10 shrink-0 items-center rounded-full bg-[#0B1030] px-5 text-sm font-medium text-white hover:bg-[#1A2150]" : "inline-flex h-10 shrink-0 items-center rounded-full border-2 border-[#E3E6EF] bg-white px-5 text-sm font-medium text-[#5B6275] hover:border-[#C9CDDA] hover:text-[#0B1030]"}>{done ? "Дахин үзэх" : started ? "Үргэлжлүүлэх" : "Эхлэх"}</Link>
    </div>}
  </div>;
}
