import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/portal-forms";
import { planName, PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { ArtTile, btnSmDark, Chip, portalCard, portalMuted } from "@/components/dashboard/portal-ui";
import { getStudentContext, type StudentPlan } from "@/lib/data/student-portal";
import { PLAN_FEATURES } from "@/lib/payments/plans";
import { PhoneSettings } from "@/components/dashboard/phone-settings";
import { EXAM_LABELS, GRADE_LABELS, type StudentGoal } from "@/lib/goals";
import { isVerifyMnConfigured } from "@/lib/verify-mn";

export const metadata: Metadata = { title: "Тохиргоо" };

export default async function Page() {
  const d = await getStudentContext();
  return <PortalShell active="/dashboard/settings" plan={d.plan}>
    <PortalHeader title="Тохиргоо" description="Профайл болон багцын мэдээллээ удирдана."/>
    <div className="mt-6 grid max-w-[920px] gap-4">
      <SubscriptionDetails plan={d.plan}/>
      <GoalSummary goal={d.goal}/>
      <SettingsForm name={d.profile.full_name ?? ""} avatarUrl={d.profile.avatar_url ?? ""}/>
      <section className={`${portalCard} flex items-center gap-4 p-5 sm:p-6`}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#E8EEFF] text-[#2B4BE8]"><Mail size={20}/></span><div className="min-w-0"><p className="text-sm font-semibold">Нэвтрэх имэйл</p><p className={`mt-0.5 truncate text-sm ${portalMuted}`}>{d.email || "—"}</p></div></section>
      <PhoneSettings phone={d.profile.phone ?? null} enabled={isVerifyMnConfigured()}/>
    </div>
  </PortalShell>;
}

function SubscriptionDetails({ plan }: { plan: StudentPlan }) {
  const paid = plan.code !== "free";
  return <section className={`rounded-[22px] border-2 p-5 sm:p-6 ${paid ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#EEF0F6] bg-white"}`}>
    <div className="flex flex-wrap items-center gap-4">
      <ArtTile kind="scorecard" bg={paid ? "#DCFCE7" : "#F1F3F8"}/>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="font-sans text-lg font-semibold tracking-normal">{planName(plan.code)} багц</h2><Chip tone={paid ? "green" : "grey"}>{paid ? "Идэвхтэй" : "Идэвхгүй"}</Chip></div><p className={`mt-1 text-sm ${portalMuted}`}>{paid && plan.periodEnd ? `${date(plan.periodEnd)} хүртэл хүчинтэй` : "Багц идэвхгүй — боломжууд хязгаартай"}</p></div>
      <Link href="/pricing" className={btnSmDark}>{paid ? "Хугацаа сунгах" : "Багц сонгох"}</Link>
    </div>
    <div className="mt-5 grid gap-2.5 text-sm sm:grid-cols-2">{features(plan.code).map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 size={16} className={paid ? "text-[#16A34A]" : "text-[#9AA0B4]"}/>{item}</p>)}</div>
  </section>;
}

function features(code: StudentPlan["code"]): readonly string[] {
  if (code !== "free") return PLAN_FEATURES;
  return ["1 бүтэн mock эсвэл ЭЕШ сорил", "Өдөрт 10 дасгал", "Сэдэв бүрийн эхний хичээл", "Тайлан, AI боломжгүй"];
}
function date(value: string) { return new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Ulaanbaatar" }).format(new Date(value)); }

function GoalSummary({ goal }: { goal: StudentGoal | null }) {
  const items = goal ? [
    ["Шалгалт", EXAM_LABELS[goal.targetExam]],
    ...(goal.eyeshGoal ? [["ЭЕШ зорилго", `${goal.eyeshGoal}${goal.eyeshExamYear ? ` · ${goal.eyeshExamYear} он` : ""}`]] : []),
    ...(goal.satGoal ? [["SAT Math зорилго", `${goal.satGoal}${goal.satExamMonth ? ` · ${goal.satExamMonth.slice(0, 7)}` : ""}`]] : []),
    ...(goal.grade ? [["Анги", GRADE_LABELS[goal.grade]]] : []),
    ...(goal.weeklyStudyHours ? [["7 хоногт", `~${goal.weeklyStudyHours} цаг`]] : []),
    ...(goal.targetUniversity ? [["Сургууль", goal.targetUniversity]] : []),
  ] : [];
  return <section className={`${portalCard} p-5 sm:p-6`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-sans text-lg font-semibold tracking-normal">Зорилго</h2><Link href="/onboarding?edit=1" className={btnSmDark}>{goal ? "Зорилго засах" : "Зорилго тавих"}</Link></div>
    {items.length > 0 && <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{items.map(([label, value]) => <div key={label}><dt className={portalMuted}>{label}</dt><dd className="mt-0.5 font-semibold">{value}</dd></div>)}</dl>}
  </section>;
}
