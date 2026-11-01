import type { Metadata } from "next";
import { Navbar, getIdentity } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHero } from "@/components/layout/page-hero";
import { BankBrowser, type BankBrowserQuestion, type BankBrowserSection } from "@/components/question-bank/bank-browser";
import { loadBankIndex, loadBankStatus } from "@/lib/data/question-bank";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SAT_DOMAINS, satSkillKey, type SatSection } from "@/lib/sat/taxonomy";

export const metadata: Metadata = { title: "SAT бодлогын сан", alternates: { canonical: "/question-bank" } };

const SECTIONS: SatSection[] = ["Math", "Reading and Writing"];

export default async function QuestionBankPage() {
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
  return <>
    <Navbar/>
    <main className="container-page py-12 sm:py-16">
      <PageHero chip="Бодлогын сан" chipIcon="∑" title="SAT бодлогын сан" text="Хэсэг, домэйн, ур чадвар, түвшингээр шүүгээд сул сэдвээ давт. Бодлого бүрийн дараа зөв хариу, тайлбарыг шууд харна." pose="think"/>
      <div className="mt-10"><BankBrowser sections={sections} questions={compact} signedIn={Boolean(identity)}/></div>
      {unplaced > 0 && <p className="mt-6 text-xs text-[#5B6275]">{unplaced} асуултын хэсэг тодорхойгүй тул санд ороогүй байна.</p>}
    </main>
    <SiteFooter/>
  </>;
}
