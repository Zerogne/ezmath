import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BarChart3, BookOpen, ClipboardCheck, Home, Settings, Target, Users } from "lucide-react";
import { AppPortalShell } from "@/components/dashboard/app-portal-shell";
import { StudentMobileNav } from "@/components/dashboard/student-mobile-nav";
import { Ezi } from "@/components/home/redesign/illustrations";
import { planName, type PlanCode } from "@/lib/payments/plans";

export { planName };

const items = [
  ["Хяналтын самбар", "/dashboard", Home], ["Миний хичээлүүд", "/dashboard/courses", BookOpen],
  ["Дасгал", "/dashboard/exercises", Target], ["Сорил & шалгалт", "/dashboard/exams", ClipboardCheck],
  ["Явцын тайлан", "/dashboard/progress", BarChart3],
  ["Миний анги", "/dashboard/classes", Users],
  ["Тохиргоо", "/dashboard/settings", Settings],
] as const;

export type PortalPlan = { code: PlanCode; periodEnd: string | null };

export function PortalShell({ active, plan, children }: { active: string; plan?: PortalPlan; children: ReactNode }) {
  const mobileAction = <Link href="/dashboard/settings" aria-label="Профайл болон тохиргоо" aria-current={active === "/dashboard/settings" ? "page" : undefined} className="flex min-h-11 items-center gap-2 rounded-xl px-2 hover:bg-[#F7F8FC]">{plan && <PlanBadge code={plan.code}/>}<Settings aria-hidden="true" size={20} className={active === "/dashboard/settings" ? "text-[#2B4BE8]" : "text-[#5B6275]"}/></Link>;
  return <AppPortalShell active={active} items={items} navigationLabel="Сурагчийн цэс" mobileBottomNavigation={<StudentMobileNav active={active}/>} mobileAction={mobileAction} footer={<SidebarPlanCard plan={plan}/>}>{children}</AppPortalShell>;
}

export function PortalHeader({ title, description, action, back }: { title: ReactNode; description?: ReactNode; action?: ReactNode; back?: { href: string; label: string } }) {
  return <header>
    {back && <Link href={back.href} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6275] hover:text-[#0B1030]"><ArrowLeft size={16}/>{back.label}</Link>}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0"><h1 className="text-[26px] font-medium leading-tight tracking-[-0.03em] sm:text-[30px]">{title}</h1>{description && <p className="mt-1 text-[15px] text-[#5B6275]">{description}</p>}</div>
      {action}
    </div>
  </header>;
}

export function PlanBadge({ code }: { code: PlanCode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-px text-[10px] font-semibold ${code !== "free" ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#F1F3F8] text-[#5B6275]"}`}>{planName(code)}</span>;
}

function SidebarPlanCard({ plan }: { plan?: PortalPlan }) {
  const code = plan?.code ?? "free";
  const paid = code !== "free";
  if (!plan) return <div className="relative pt-14">
    <Ezi pose="wave" size={76} className="absolute left-[132px] top-0"/>
    <div className="rounded-[20px] bg-[#0B1030] p-[18px] text-white"><p className="text-[13px] font-medium text-[#AEB4CC]">EzMath багц</p><p className="mt-1.5 text-sm leading-5 text-white">Бүх сорил, тайлан, AI төлөвлөгөө нэг дор.</p><Link href="/pricing" className="mt-3.5 flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#0B1030] hover:bg-[#EEF1FF]">Багц харах</Link></div>
  </div>;
  return <div className="relative pt-14">
    <Ezi pose="wave" size={76} className="absolute left-[132px] top-0"/>
    <div className="rounded-[20px] bg-[#0B1030] p-[18px] text-white">
      <div className="flex items-center justify-between"><p className="text-[13px] font-medium text-[#AEB4CC]">Таны багц</p>{paid && <span className="rounded-full bg-[rgba(52,211,153,0.18)] px-2.5 py-1 text-xs font-semibold text-[#6EE7B7]">● Идэвхтэй</span>}</div>
      <p className="mt-1.5 font-display text-2xl font-medium tracking-[-0.03em]">{planName(code)}</p>
      <p className="mt-0.5 text-xs text-[#AEB4CC]">{paid ? plan?.periodEnd ? `${formatPlanDate(plan.periodEnd)} хүртэл` : "Идэвхтэй эрх" : "Бүх сорил, тайлангаа нээгээрэй"}</p>
      <Link href="/pricing" className="mt-3.5 flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#0B1030] hover:bg-[#EEF1FF]">{paid ? "Хугацаа сунгах" : "Багц сонгох"}</Link>
    </div>
  </div>;
}

function formatPlanDate(value: string) { return new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Ulaanbaatar" }).format(new Date(value)); }
