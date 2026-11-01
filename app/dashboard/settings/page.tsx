import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/portal-forms";
import { planName, PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { ArtTile, btnSmDark, Chip, portalCard, portalMuted } from "@/components/dashboard/portal-ui";
import { getPortalData, type StudentPlan } from "@/lib/data/student-portal";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function Page() {
  const d = await getPortalData();
  return <PortalShell active="/dashboard/settings" plan={d.plan}>
    <PortalHeader title="Тохиргоо" description="Профайл болон багцын мэдээллээ удирдана."/>
    <div className="mt-6 grid max-w-[920px] gap-4">
      <SubscriptionDetails plan={d.plan}/>
      <SettingsForm name={d.profile.full_name ?? ""} avatarUrl={d.profile.avatar_url ?? ""}/>
      <section className={`${portalCard} flex items-center gap-4 p-5 sm:p-6`}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#E8EEFF] text-[#2B4BE8]"><Mail size={20}/></span><div className="min-w-0"><p className="text-sm font-semibold">Нэвтрэх имэйл</p><p className={`mt-0.5 truncate text-sm ${portalMuted}`}>{d.email || "—"}</p></div></section>
    </div>
  </PortalShell>;
}

function SubscriptionDetails({ plan }: { plan: StudentPlan }) {
  const paid = plan.code !== "free";
  return <section className={`rounded-[22px] border-2 p-5 sm:p-6 ${paid ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#EEF0F6] bg-white"}`}>
    <div className="flex flex-wrap items-center gap-4">
      <ArtTile kind="scorecard" bg={paid ? "#DCFCE7" : "#F1F3F8"}/>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-sans text-lg font-semibold tracking-normal">{planName(plan.code)} багц</h2><Chip tone={paid ? "green" : "grey"}>{paid ? "Идэвхтэй" : "Үнэгүй"}</Chip></div><p className={`mt-1 text-sm ${portalMuted}`}>{paid && plan.periodEnd ? `${date(plan.periodEnd)} хүртэл хүчинтэй` : "Хязгаартай үнэгүй эрх"}</p></div>
      {plan.code !== "mentor_monthly" && <Link href="/pricing" className={btnSmDark}>{paid ? "Ментор+ болгох" : "Багц ахиулах"}</Link>}
    </div>
    <div className="mt-5 grid gap-2.5 text-sm sm:grid-cols-2">{features(plan.code).map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className={paid ? "text-[#16A34A]" : "text-[#9AA0B4]"}/>{item}</p>)}</div>
  </section>;
}

function features(code: StudentPlan["code"]) {
  if (code === "mentor_monthly") return ["Бүх курс ба шалгалт", "Дэлгэрэнгүй тайлан", "AI хувийн төлөвлөгөө", "1:1 менторын уулзалт"];
  if (code === "standard_monthly") return ["Бүх курс ба шалгалт", "Дэлгэрэнгүй тайлан", "Хязгааргүй дасгал", "AI гүйцэтгэлийн анализ"];
  return ["1 бүтэн mock эсвэл ЭЕШ", "Өдөрт 10 дасгал", "Хязгаартай хичээл", "Дэлгэрэнгүй тайлангүй"];
}
function date(value: string) { return new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Ulaanbaatar" }).format(new Date(value)); }
