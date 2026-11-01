import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TestCard } from "@/components/home/test-card";
import { Ezi } from "@/components/home/redesign/illustrations";
import { EmptyState } from "@/components/ui/empty-state";
import { sectionForSubject } from "@/lib/sat/taxonomy";
import type { Test } from "@/types/exam";

/** SAT the OnePrep way: the filterable question bank first, then numbered full-length mocks, then section tests. */
export function SatHub({ tests, bankCounts }: { tests: Test[]; bankCounts: { math: number; readingWriting: number } }) {
  // Tests arrive newest first; mocks are numbered in the order they were published.
  const ordered = [...tests].reverse();
  const mocks = ordered.filter((test) => test.type === "full");
  const sectionTests = ordered.filter((test) => test.type !== "full");
  const groups = [
    { title: "Math", tests: sectionTests.filter((test) => sectionForSubject(test.subject) === "Math") },
    { title: "Reading & Writing", tests: sectionTests.filter((test) => sectionForSubject(test.subject) === "Reading and Writing") },
    { title: "Бусад", tests: sectionTests.filter((test) => !sectionForSubject(test.subject)) },
  ].filter((group) => group.tests.length);

  return <div className="mt-10 space-y-14">
    <Link href="/question-bank" className="group relative flex flex-col gap-6 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#E8EEFF_0%,#D4E7FF_60%,#C3F0E2_100%)] p-7 sm:flex-row sm:items-center sm:p-10">
      <div className="flex-1">
        <span className="rounded-md bg-white/80 px-[7px] py-[3px] text-[11px] font-semibold text-[#2B4BE8]">Бодлогын сан</span>
        <h2 className="mt-4 text-3xl font-medium sm:text-4xl">Ур чадвар бүрээр дасгал хий</h2>
        <p className="mt-3 max-w-xl text-[#5B6275]">Хэсэг, домэйн, ур чадвар, түвшингээр шүүж бод. Буруу хариулсан, тэмдэглэсэн асуултаа дахин давт.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold"><span className="rounded-full bg-white px-3.5 py-1.5">Math · {bankCounts.math}</span><span className="rounded-full bg-white px-3.5 py-1.5">Reading & Writing · {bankCounts.readingWriting}</span></div>
        <span className="btn-dark mt-6 group-hover:-translate-y-0.5">Бодлогын сан нээх<ArrowRight size={17}/></span>
      </div>
      <Ezi pose="think" size={170} className="hidden shrink-0 self-end sm:block"/>
    </Link>

    <section>
      <h2 className="text-2xl font-medium sm:text-3xl">Бүтэн mock шалгалт</h2>
      <p className="mt-2 text-[#5B6275]">Бодит шалгалтын хугацаа, бүтэцтэй. Дугаараар нь дарааллаар өгөөрэй.</p>
      {mocks.length ? <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mocks.map((test, index) => <li key={test.id} className="relative"><span className="absolute -left-2 -top-2 z-[1] grid h-8 w-8 place-items-center rounded-full bg-[#0B1030] font-display text-sm font-medium text-white">{index + 1}</span><TestCard test={test}/></li>)}</ol>
        : <EmptyState className="mt-6" pose="sleep" title="Mock шалгалт удахгүй нэмэгдэнэ"/>}
    </section>

    {groups.length > 0 && <section>
      <h2 className="text-2xl font-medium sm:text-3xl">Хэсгийн сорил</h2>
      <p className="mt-2 text-[#5B6275]">Нэг хэсгийг тусад нь, бодит хугацаагаар дадлага хий.</p>
      {groups.map((group) => <div key={group.title} className="mt-6"><h3 className="text-sm font-semibold uppercase tracking-[.14em] text-[#5B6275]">{group.title}</h3><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.tests.map((test) => <TestCard key={test.id} test={test}/>)}</div></div>)}
    </section>}
  </div>;
}
