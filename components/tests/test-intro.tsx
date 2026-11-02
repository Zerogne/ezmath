import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import type { Test } from "@/types/exam";
import { Ezi, ObjectArt } from "@/components/home/redesign/illustrations";

const LEVEL: Record<string, string> = { easy: "Хялбар", medium: "Дунд", hard: "Хүнд", Easy: "Хялбар", Medium: "Дунд", Hard: "Хүнд" };
const TYPE = { full: "Бүтэн mock", practice: "Хэсгийн сорил", "previous-year": "Өмнөх оны шалгалт" } as const;
const rules = ["Хариулт бүрээс нэг сонголт сонгоно.", "Асуултуудын хооронд чөлөөтэй шилжиж болно.", "Хариултаа тэмдэглэж дараа нь эргэж болно.", "Хугацаа дуусмагц шалгалт автоматаар дуусна."];

export function TestIntro({ test }: { test: Test }) {
  const sat = test.examType === "SAT";
  const info = [
    { icon: ListChecks, label: "Асуулт", value: `${test.questionCount}`, bg: "#E8EEFF" },
    { icon: Clock3, label: "Хугацаа", value: formatDuration(test.durationMinutes), bg: "#FFF0E6" },
    { icon: BarChart3, label: "Түвшин", value: test.difficulty ? LEVEL[test.difficulty] ?? test.difficulty : "Холимог", bg: "#EFE6FF" },
    { icon: BookOpen, label: "Хэсэг", value: test.subject, bg: "#E9FBF2" },
  ];
  return <main className="bg-gradient-to-b from-white to-[#F6F7FB] pb-20">
    <div className="container-page pt-8 sm:pt-10">
      <Link href={sat ? "/tests?exam=SAT" : "/tests"} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6275] hover:text-[#0B1030]"><ArrowLeft size={16}/>Шалгалтууд руу буцах</Link>
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-[26px] border-2 border-[#EEF0F6] bg-white p-6 sm:p-10">
          <div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${sat ? "bg-[#FFF6CC] text-[#B45309]" : "bg-[#E8EEFF] text-[#2B4BE8]"}`}>{sat ? "SAT" : "ЭЕШ"}</span><span className="rounded-full bg-[#F1F3F8] px-3 py-1 text-xs font-semibold text-[#5B6275]">{TYPE[test.type]}</span></div>
          <h1 className="mt-5 text-[34px] font-medium leading-[1.1] tracking-[-0.03em] sm:text-[48px]">{test.title}</h1>
          {test.description && <p className="mt-4 max-w-[640px] text-lg leading-relaxed text-[#5B6275]">{test.description}</p>}
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{info.map(({ icon: Icon, label, value, bg }) => <div key={label} className="rounded-[18px] p-4" style={{ background: bg }}><Icon size={18} className="text-[#0B1030]"/><dt className="mt-3 text-xs font-medium text-[#5B6275]">{label}</dt><dd className="mt-0.5 font-display text-lg font-medium tracking-[-0.02em]">{value}</dd></div>)}</dl>
          <section className="mt-9 border-t-2 border-[#F4F5FA] pt-8">
            <h2 className="font-sans text-lg font-semibold tracking-normal">Заавар</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">{rules.map((rule) => <li key={rule} className="flex gap-3 rounded-2xl bg-[#F8F9FC] px-4 py-3.5 text-[15px] leading-6"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#2B4BE8]"/>{rule}</li>)}</ul>
          </section>
        </section>
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="relative pt-[70px]"><Ezi pose="laptop" size={110} className="absolute right-6 top-0"/><div className="rounded-[26px] bg-[#0B1030] p-7 text-white">
            <p className="text-[13px] font-medium text-[#AEB4CC]">Бэлэн үү?</p>
            <p className="mt-1 font-display text-[26px] font-medium leading-tight tracking-[-0.03em]">{formatDuration(test.durationMinutes)} · {test.questionCount} асуулт</p>
            <p className="mt-2 max-w-[220px] text-sm leading-6 text-[#AEB4CC]">Таймер “Шалгалт эхлэх” дарсны дараа ажиллана.</p>
            <Link href={`/tests/${test.id}/take`} className="mt-6 flex h-[52px] items-center justify-center gap-2 rounded-full bg-white text-[17px] font-medium text-[#0B1030] transition hover:bg-[#EEF1FF]">Шалгалт эхлэх<ArrowRight size={17}/></Link>
          </div></div>
          <div className="flex items-center gap-4 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#E9FBF2]"><ObjectArt kind={sat ? "calculator" : "scorecard"} size={46}/></span>
            <p className="text-sm leading-6 text-[#5B6275]">{sat ? "Дуусгасны дараа оноо, ур чадвар тус бүрийн задаргаа, тайлбар шууд гарна." : "Дуусгасны дараа зөв хариу, сэдэв тус бүрийн задаргаа болон тайлбар шууд гарна."}</p>
          </div>
        </aside>
      </div>
    </div>
  </main>;
}
