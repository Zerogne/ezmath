import Link from "next/link";
import { BarChart3, BookOpen, ClipboardCheck, Home, Target } from "lucide-react";

const items = [
  ["Нүүр", "/dashboard", Home],
  ["Хичээл", "/dashboard/courses", BookOpen],
  ["Дасгал", "/dashboard/exercises", Target],
  ["Шалгалт", "/dashboard/exams", ClipboardCheck],
  ["Ахиц", "/dashboard/progress", BarChart3],
] as const;

export function StudentMobileNav({ active }: { active: string }) {
  return <nav aria-label="Сурагчийн үндсэн цэс" className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"><div className="mx-auto grid h-16 max-w-lg grid-cols-5 px-1">{items.map(([label, href, Icon]) => {
    const current = href === "/dashboard" ? active === href : active.startsWith(href);
    return <Link key={href} href={href} aria-current={current ? "page" : undefined} className={`flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${current ? "text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon aria-hidden="true" size={20} strokeWidth={current ? 2.5 : 2}/><span>{label}</span></Link>;
  })}</div></nav>;
}
