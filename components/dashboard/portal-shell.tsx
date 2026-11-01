import Link from "next/link";
import { BarChart3, BookOpen, CircleHelp, ClipboardCheck, Home, Settings, Target, Users } from "lucide-react";
import { AppPortalShell } from "@/components/dashboard/app-portal-shell";
import { StudentMobileNav } from "@/components/dashboard/student-mobile-nav";

const items = [
  ["Хяналтын самбар", "/dashboard", Home], ["Миний хичээлүүд", "/dashboard/courses", BookOpen],
  ["Дасгал", "/dashboard/exercises", Target], ["Сорил & шалгалт", "/dashboard/exams", ClipboardCheck],
  ["Явцын тайлан", "/dashboard/progress", BarChart3], ["Багшаас асуух", "/dashboard/ask", CircleHelp],
  ["Миний анги", "/dashboard/classes", Users],
  ["Тохиргоо", "/dashboard/settings", Settings],
] as const;

export function PortalShell({ active, children }: { active: string; children: React.ReactNode }) {
  return <AppPortalShell active={active} items={items} navigationLabel="Сурагчийн цэс" mobileBottomNavigation={<StudentMobileNav active={active}/>} footer={<div className="rounded-[18px] bg-[#0B1030] p-4 text-white"><p className="text-[13px] font-medium">Ментор багц</p><p className="mt-2 text-xs leading-5 text-slate-400">7 хоног бүр 1:1 уулзалт нэмээд ав.</p><Link href="/pricing" className="mt-3 flex justify-center rounded-full bg-[#2B4BE8] py-2 text-xs font-semibold">Дэлгэрэнгүй</Link></div>}>{children}</AppPortalShell>;
}

export function PortalHeader({ title, description }: { title: string; description: string }) { return <header><p className="text-xs font-semibold tracking-[.15em] text-primary">СУРАГЧИЙН ХЭСЭГ</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">{title}</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></header>; }
