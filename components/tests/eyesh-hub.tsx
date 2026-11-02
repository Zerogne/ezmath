import Link from "next/link";
import { ArrowRight, Clock3, ListChecks } from "lucide-react";
import type { Test } from "@/types/exam";
import { ObjectArt, type ObjectKind } from "@/components/home/redesign/illustrations";
import { EmptyState } from "@/components/ui/empty-state";

const tiles: [ObjectKind, string][] = [["notebook", "#E8EEFF"], ["graph", "#FFF6CC"], ["protractor", "#E9FBF2"], ["calculator", "#EFE6FF"], ["chart", "#FFE8EF"], ["pencil", "#FFF0E6"]];

/** ЭЕШ archive grouped by year: one card per year with a button per variant (А, B, C, D…). */
export function EyeshHub({ tests }: { tests: Test[] }) {
  if (!tests.length) return <EmptyState className="mt-8" pose="sleep" title="ЭЕШ шалгалт хараахан нийтлэгдээгүй байна"/>;
  const byYear = new Map<number, Test[]>();
  const other: Test[] = [];
  for (const test of tests) {
    if (!test.year) { other.push(test); continue; }
    byYear.set(test.year, [...(byYear.get(test.year) ?? []), test]);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);
  const totalQuestions = tests.reduce((sum, test) => sum + test.questionCount, 0);

  return <div className="mt-8">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat value={`${tests.length}`} label="хувилбар"/>
      <Stat value={years.length ? `${years.at(-1)}–${years[0]}` : "—"} label="он"/>
      <Stat value={totalQuestions.toLocaleString("en-US")} label="бодлого"/>
      <Stat value="Шууд" label="хариу ба тайлбар"/>
    </div>

    {years.length > 0 && <nav aria-label="Он" className="mt-8 flex flex-wrap gap-2">{years.map((year) => <a key={year} href={`#y${year}`} className="rounded-full border-2 border-[#EEF0F6] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#5B6275] transition hover:border-[#2B4BE8] hover:text-[#2B4BE8]">{year}</a>)}</nav>}

    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{years.map((year, index) => {
      const variants = byYear.get(year)!.sort((a, b) => (a.variant ?? "").localeCompare(b.variant ?? ""));
      const [art, bg] = tiles[index % tiles.length];
      const first = variants[0];
      return <article key={year} id={`y${year}`} className="scroll-mt-24 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 transition hover:border-[#DCE5FF] hover:shadow-[0_18px_40px_-28px_rgba(11,16,48,.35)]">
        <div className="flex items-start justify-between gap-3">
          <div><span className="rounded-md bg-[#E8EEFF] px-2 py-0.5 text-[11px] font-semibold text-[#2B4BE8]">ЭЕШ · {first.subject}</span><p className="mt-2 font-display text-[40px] font-medium leading-none tracking-[-0.03em]">{year}</p></div>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px]" style={{ background: bg }}><ObjectArt kind={art} size={52}/></span>
        </div>
        <div className="mt-3 flex gap-4 text-xs font-medium text-[#5B6275]"><span className="inline-flex items-center gap-1"><ListChecks size={14}/>{first.questionCount} бодлого</span><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{formatMinutes(first.durationMinutes)}</span></div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">Хувилбар</p>
        <div className="mt-2 flex flex-wrap gap-2">{variants.map((test) => <Link key={test.id} href={`/tests/${test.id}`} aria-label={test.title} title={test.title} className="grid h-11 min-w-11 place-items-center rounded-xl border-2 border-[#E3E6EF] px-3 text-[15px] font-semibold transition hover:border-[#2B4BE8] hover:bg-[#E8EEFF] hover:text-[#2B4BE8]">{test.variant ?? "—"}</Link>)}</div>
      </article>;
    })}</div>

    {other.length > 0 && <section className="mt-10"><h2 className="font-sans text-lg font-semibold tracking-normal">Бусад сорил</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{other.map((test) => <Link key={test.id} href={`/tests/${test.id}`} className="flex items-center gap-4 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 transition hover:border-[#DCE5FF]"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#E8EEFF]"><ObjectArt kind="notebook" size={44}/></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{test.title}</span><span className="mt-0.5 block text-xs text-[#5B6275]">{test.questionCount} бодлого · {formatMinutes(test.durationMinutes)}</span></span><ArrowRight size={16} className="shrink-0 text-[#2B4BE8]"/></Link>)}</div></section>}
  </div>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-[20px] border-2 border-[#EEF0F6] bg-white px-5 py-4"><p className="font-display text-[26px] font-medium leading-tight tracking-[-0.03em]">{value}</p><p className="text-[13px] text-[#5B6275]">{label}</p></div>;
}

function formatMinutes(minutes: number) { const h = Math.floor(minutes / 60); const m = minutes % 60; return h ? `${h}ц ${m ? `${m}м` : ""}`.trim() : `${m} мин`; }
