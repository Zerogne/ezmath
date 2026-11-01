import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { TestFilter } from "@/components/tests/test-filter";
import { SatHub } from "@/components/tests/sat-hub";
import { listPublishedTests } from "@/lib/data/test-repository";
import { loadBankIndex } from "@/lib/data/question-bank";
import { PageHero } from "@/components/layout/page-hero";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = { title: "Бүх шалгалт нэг дор" };

const tabs = [["EYESH", "ЭЕШ"], ["SAT", "SAT"]] as const;

export default async function TestsPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const { exam } = await searchParams;
  const active = exam === "SAT" ? "SAT" : "EYESH";
  const [tests, bank] = await Promise.all([listPublishedTests(), active === "SAT" ? loadBankIndex() : null]);
  const examTests = tests.filter((test) => test.examType === active);
  return <><Navbar/><main className="container-page py-12 sm:py-16">
    {active === "SAT"
      ? <PageHero chip="SAT бэлтгэл" chipIcon="S" chipBg="#0B1030" title="SAT Math & Reading" text="Бүтэн mock шалгалт, хэсгийн сорил, ур чадвараар шүүдэг бодлогын сан." pose="laptop"/>
      : <PageHero chip="Шалгалтын сан" chipIcon="∑" title="ЭЕШ шалгалтууд" text="2006 оноос хойшхи ЭЕШ-ийн хувилбаруудаас сонгон мэдлэгээ сорьж, ахицаа үнэлээрэй." pose="laptop"/>}
    <nav aria-label="Шалгалтын төрөл" className="mt-8 inline-flex rounded-full bg-[#F1F3F8] p-1">{tabs.map(([value, label]) => <Link key={value} href={`/tests?exam=${value}`} aria-current={active === value ? "page" : undefined} className={`rounded-full px-6 py-2 text-sm font-semibold transition ${active === value ? "bg-white text-[#0B1030] shadow-sm" : "text-[#5B6275] hover:text-[#0B1030]"}`}>{label}</Link>)}</nav>
    {active === "SAT" && bank
      ? <SatHub tests={examTests} bankCounts={{ math: bank.questions.filter((question) => question.section === "Math").length, readingWriting: bank.questions.filter((question) => question.section === "Reading and Writing").length }}/>
      : <div className="mt-8"><TestFilter tests={examTests} initialExam="EYESH" showExamFilter={false}/></div>}
  </main><SiteFooter/></>;
}
