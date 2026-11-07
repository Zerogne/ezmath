import Link from "next/link";
import { ArrowRight, Clock3, ListChecks } from "lucide-react";
import { getIdentity } from "@/components/layout/navbar";
import { BankBrowser, type BankBrowserQuestion, type BankBrowserSection } from "@/components/question-bank/bank-browser";
import { ObjectArt, type ObjectKind } from "@/components/home/redesign/illustrations";
import { EmptyState } from "@/components/ui/empty-state";
import { loadBankIndex, loadBankStatus } from "@/lib/data/question-bank";
import { SAT_DOMAINS, satSkillKey, sectionForSubject, type SatSection } from "@/lib/sat/taxonomy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatDuration } from "@/lib/utils";
import type { Test } from "@/types/exam";

const SECTIONS: SatSection[] = ["Math", "Reading and Writing"];

/** The whole SAT area on one page: numbered full mocks first, then section tests, then the filterable question bank. */
export async function SatHub({ tests }: { tests: Test[] }) {
  const [{ questions, unplaced }, identity] = await Promise.all([loadBankIndex(), getIdentity()]);
  let status: Awaited<ReturnType<typeof loadBankStatus>> = new Map();
  if (identity && isSupabaseConfigured()) {
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (user) status = await loadBankStatus(user.id);
  }
  const sections: BankBrowserSection[] = SECTIONS.map((section) => ({
    section,
    unclassifiedKey: `unclassified-${satSkillKey(section)}`,
    domains: SAT_DOMAINS.filter((domain) => domain.section === section).map((domain) => ({
      name: domain.name,
      groups: [...domain.skills.map((skill) => ({ key: satSkillKey(skill), label: skill })), { key: `other-${satSkillKey(domain.name)}`, label: "Бусад" }],
    })),
  }));
  const compact: BankBrowserQuestion[] = questions.map((question) => {
    const state = status.get(question.id);
    return { section: question.section, group: question.group, difficulty: question.difficulty, result: !state?.answered ? "new" : state.lastCorrect ? "correct" : "incorrect", marked: state?.marked ?? false };
  });

  // Tests arrive newest first; mocks are numbered in the order they were published.
  const ordered = [...tests].reverse();
  const mocks = ordered.filter((test) => test.type === "full");
  const sectionTests = ordered.filter((test) => test.type !== "full");
  const groups = [
    { title: "Math", tests: sectionTests.filter((test) => sectionForSubject(test.subject) === "Math") },
    { title: "Reading & Writing", tests: sectionTests.filter((test) => sectionForSubject(test.subject) === "Reading and Writing") },
    { title: "Бусад", tests: sectionTests.filter((test) => !sectionForSubject(test.subject)) },
  ].filter((group) => group.tests.length);
  const jumps = [["#mocks", "Бүтэн mock", mocks.length], ["#sections", "Хэсгийн сорил", sectionTests.length], ["#bank", "Бодлогын сан", questions.length]] as const;

  return <div className="mt-8">
    <nav aria-label="SAT хэсгүүд" className="flex flex-wrap gap-2">{jumps.map(([href, label, count]) => <a key={href} href={href} className="inline-flex items-center gap-2 rounded-full border-2 border-[#EEF0F6] bg-white px-4 py-2 text-sm font-semibold transition hover:border-[#2B4BE8] hover:text-[#2B4BE8]">{label}<span className="rounded-full bg-[#F1F3F8] px-2 py-px text-xs text-[#5B6275]">{count}</span></a>)}</nav>

    {/* Phones and tablets: two stacked sections of cards. Desktop (lg+): two equal-height panels side by side with compact test rows. */}
    <div className="mt-10 lg:grid lg:grid-cols-2 lg:gap-6">
      <section id="mocks" className="scroll-mt-24 lg:flex lg:flex-col lg:rounded-[28px] lg:border-2 lg:border-[#EEF0F6] lg:bg-white lg:p-7">
        <SectionHead art="calculator" tile="#E9FBF2" title="Бүтэн mock шалгалт" text="Бодит шалгалтын хугацаа, бүтэцтэй. Дугаараар нь дарааллаар өгөөрэй."/>
        {mocks.length ? <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-3">{mocks.map((test, index) => <li key={test.id}><SatTestCard test={test} number={index + 1}/></li>)}</ol>
          : <EmptyState className="mt-6" pose="sleep" title="Mock шалгалт удахгүй нэмэгдэнэ"/>}
        <p className="hidden rounded-2xl bg-[#F7F8FC] px-4 py-3.5 text-sm leading-6 text-[#5B6275] lg:mt-auto lg:block"><b className="font-semibold text-[#0B1030]">Зөвлөмж:</b> Mock-ийг бодит шалгалт шиг нэг дор, цагтай өг. Дууссаны дараа AI дүн шинжилгээ сул сэдвийг чинь харуулна.</p>
      </section>

      <section id="sections" className="mt-14 scroll-mt-24 lg:mt-0 lg:rounded-[28px] lg:border-2 lg:border-[#EEF0F6] lg:bg-white lg:p-7">
        <SectionHead art="stopwatch" tile="#FFF0E6" title="Хэсгийн сорил" text="Нэг хэсгийг тусад нь, бодит хугацаагаар дадлага хий."/>
        {groups.length ? groups.map((group) => <div key={group.title} className="mt-6 lg:mt-5"><h3 className="text-xs font-semibold uppercase tracking-[.14em] text-[#9AA0B4]">{group.title}</h3><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-3">{group.tests.map((test) => <SatTestCard key={test.id} test={test}/>)}</div></div>)
          : <EmptyState className="mt-6" pose="sleep" title="Хэсгийн сорил удахгүй нэмэгдэнэ"/>}
      </section>
    </div>
    <section id="bank" className="mt-16 scroll-mt-24">
      <SectionHead art="target" tile="#E8EEFF" title="Бодлогын сан" text="Хэсэг, домэйн, ур чадвар, түвшингээр шүүгээд бод. Бодлого бүрийн дараа зөв хариу, тайлбар шууд гарна. Буруу хариулсан, тэмдэглэсэн асуултаа дахин давт."/>
      <div className="mt-6"><BankBrowser sections={sections} questions={compact} signedIn={Boolean(identity)}/></div>
      {unplaced > 0 && <p className="mt-4 text-xs text-[#5B6275]">{unplaced} асуултын хэсэг тодорхойгүй тул санд ороогүй байна.</p>}
    </section>

  </div>;
}

function SectionHead({ art, tile, title, text }: { art: ObjectKind; tile: string; title: string; text: string }) {
  return <div className="flex items-center gap-4"><span className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px]" style={{ background: tile }}><ObjectArt kind={art} size={52}/></span><div><h2 className="text-[28px] font-medium leading-tight tracking-[-0.03em] sm:text-[34px] lg:text-[30px]">{title}</h2><p className="mt-1 max-w-[720px] text-[15px] text-[#5B6275]">{text}</p></div></div>;
}

function SatTestCard({ test, number }: { test: Test; number?: number }) {
  const math = sectionForSubject(test.subject) === "Math";
  return <Link href={`/tests/${test.id}`} className="group flex h-full flex-col rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 transition hover:border-[#DCE5FF] hover:shadow-[0_18px_40px_-28px_rgba(11,16,48,.35)] lg:grid lg:grid-cols-[56px_minmax(0,1fr)_auto] lg:items-center lg:gap-x-4 lg:gap-y-0 lg:p-4">
    <div className="flex items-start justify-between gap-3 lg:contents">
      {number ? <span className="grid h-14 w-14 place-items-center rounded-[18px] bg-[#0B1030] font-display text-2xl font-medium text-white lg:col-start-1 lg:row-span-3 lg:row-start-1">{number}</span>
        : <span className="grid h-14 w-14 place-items-center rounded-[18px] lg:col-start-1 lg:row-span-3 lg:row-start-1" style={{ background: math ? "#E9FBF2" : "#EFE6FF" }}><ObjectArt kind={math ? "calculator" : "notebook"} size={44}/></span>}
      <span className="rounded-full bg-[#FFF6CC] px-3 py-1 text-xs font-semibold text-[#B45309] lg:col-start-3 lg:row-start-1 lg:self-center lg:justify-self-end">{number ? "Бүтэн mock" : test.subject}</span>
    </div>
    <h3 className="mt-4 font-sans text-[17px] font-semibold leading-snug tracking-normal lg:col-start-2 lg:row-start-1 lg:mt-0 lg:truncate">{test.title}</h3>
    {test.description && <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[#5B6275] lg:col-start-2 lg:row-start-2 lg:mt-0 lg:line-clamp-1">{test.description}</p>}
    <div className="mt-auto flex items-center justify-between pt-5 lg:col-span-2 lg:col-start-2 lg:row-start-3 lg:mt-0 lg:pt-1.5">
      <span className="flex gap-4 text-xs font-medium text-[#5B6275]"><span className="inline-flex items-center gap-1"><ListChecks size={14}/>{test.questionCount} асуулт</span><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{formatDuration(test.durationMinutes)}</span></span>
      <ArrowRight size={17} className="text-[#2B4BE8] transition group-hover:translate-x-0.5"/>
    </div>
  </Link>;
}
