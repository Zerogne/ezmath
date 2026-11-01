import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { btnSmDark } from "@/components/dashboard/portal-ui";
import { TestGrid } from "@/components/dashboard/portal-views";
import { Art } from "@/components/home/redesign/illustrations";
import { getPortalData } from "@/lib/data/student-portal";

export const metadata: Metadata = { title: "Дасгал" };

export default async function Page() {
  const d = await getPortalData();
  return <PortalShell active="/dashboard/exercises" plan={d.plan}>
    <PortalHeader title="Дасгал" description="Сэдэвчилсэн болон богино хугацааны дасгалуудаас сонго."/>
    <section className="relative mt-6 flex flex-wrap items-center gap-5 overflow-hidden rounded-[22px] border-2 border-[#FFEDA3] bg-[#FFF6CC] p-5 sm:p-6">
      <div className="min-w-0 flex-1"><h2 className="font-sans text-lg font-semibold tracking-normal">SAT бодлогын сан</h2><p className="mt-1 max-w-xl text-sm leading-6 text-[#5B4A12]">Ур чадвар, хүндийн түвшнээр шүүж бод. Буруу хариулсан болон тэмдэглэсэн асуултаа дахин давт.</p><Link href="/question-bank" className={`${btnSmDark} mt-4`}>Бодлогын сан нээх<ArrowRight size={15}/></Link></div>
      <Art name="friend-sun" size={112} className="hidden shrink-0 sm:block"/>
    </section>
    <TestGrid tests={d.tests.filter((item) => item.type === "practice")} attempts={d.attempts} action="Дасгал эхлэх"/>
  </PortalShell>;
}
