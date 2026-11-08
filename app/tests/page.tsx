import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { EyeshHub } from "@/components/tests/eyesh-hub";
import { SatHub } from "@/components/tests/sat-hub";
import { listPublishedTests } from "@/lib/data/test-repository";
import { PageHero } from "@/components/layout/page-hero";
import { SiteFooter } from "@/components/layout/site-footer";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ exam?: string }> }): Promise<Metadata> {
  const { exam } = await searchParams;
  if (exam === "SAT") return { title: "SAT Math ба Reading бэлтгэл — mock шалгалт, бодлогын сан", description: "SAT-ын албан ёсны ур чадвараар ангилсан бодлогын сан, бүтэн mock шалгалт, хэсгийн сорил. Оноо, тайлангаа шууд аваарай.", alternates: { canonical: "/tests?exam=SAT" } };
  return { title: "ЭЕШ математик — өмнөх оны хувилбарууд, хариу", description: "ЭЕШ-ийн математикийн өмнөх оны A, B, C, D хувилбаруудыг онлайн бодоод оноо, зөв хариу, сэдвийн тайлангаа аваарай.", alternates: { canonical: "/tests?exam=EYESH" } };
}

const tabs = [["EYESH", "ЭЕШ"], ["SAT", "SAT"]] as const;

export default async function TestsPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const { exam } = await searchParams;
  const active = exam === "SAT" || exam === "EYESH" ? exam : await preferredExam();
  const tests = await listPublishedTests();
  const examTests = tests.filter((test) => test.examType === active);
  return <><Navbar/><main className="container-page py-12 sm:py-16">
    {active === "SAT"
      ? <PageHero chip="SAT бэлтгэл" chipIcon="S" chipBg="#0B1030" title="SAT Math & Reading" text="Ур чадвараар шүүдэг бодлогын сан, бүтэн mock шалгалт, хэсгийн сорил — бүгд нэг дор." pose="laptop"/>
      : <PageHero chip="Шалгалтын сан" chipIcon="∑" title="ЭЕШ шалгалтууд" text="2006 оноос хойшхи ЭЕШ-ийн хувилбаруудаас сонгон мэдлэгээ сорьж, ахицаа үнэлээрэй." pose="laptop"/>}
    <nav aria-label="Шалгалтын төрөл" className="mt-8 inline-flex rounded-full bg-[#F1F3F8] p-1">{tabs.map(([value, label]) => <Link key={value} href={`/tests?exam=${value}`} aria-current={active === value ? "page" : undefined} className={`rounded-full px-6 py-2 text-sm font-semibold transition ${active === value ? "bg-white text-[#0B1030] shadow-sm" : "text-[#5B6275] hover:text-[#0B1030]"}`}>{label}</Link>)}</nav>
    {active === "SAT" ? <SatHub tests={examTests}/> : <EyeshHub tests={examTests}/>}
  </main><SiteFooter/></>;
}

/** Signed-in students land on the exam they chose during onboarding; everyone else sees ЭЕШ first. */
async function preferredExam(): Promise<"SAT" | "EYESH"> {
  if (!isSupabaseConfigured()) return "EYESH";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "EYESH";
  const { data } = await supabase.from("profiles").select("target_exam").eq("id", user.id).maybeSingle();
  return data?.target_exam === "SAT" ? "SAT" : "EYESH";
}
