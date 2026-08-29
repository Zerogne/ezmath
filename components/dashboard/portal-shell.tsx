import Link from "next/link";
import { BarChart3, BookOpen, CircleHelp, ClipboardCheck, Home, Menu, Settings, Target, Users } from "lucide-react";

const items = [
  ["Хяналтын самбар", "/dashboard", Home], ["Миний хичээлүүд", "/dashboard/courses", BookOpen],
  ["Дасгал", "/dashboard/exercises", Target], ["Сорил & шалгалт", "/dashboard/exams", ClipboardCheck],
  ["Явцын тайлан", "/dashboard/progress", BarChart3], ["Багшаас асуух", "/dashboard/ask", CircleHelp],
  ["Тохиргоо", "/dashboard/settings", Settings],
  ["Миний анги", "/dashboard/classes", Users],
] as const;

export function PortalShell({ active, children }: { active: string; children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f7fb] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="hidden h-screen flex-col border-r bg-white px-4 py-5 lg:sticky lg:top-0 lg:flex">
      <Brand/><Navigation active={active}/>
      <div className="mt-auto rounded-[14px] bg-[#0b1030] p-4 text-white"><p className="text-[13px] font-medium">Ментор багц</p><p className="mt-2 text-xs leading-5 text-slate-400">7 хоног бүр 1:1 уулзалт нэмээд ав.</p><Link href="/#pricing" className="mt-3 flex justify-center rounded-lg bg-primary py-2 text-xs">Дэлгэрэнгүй</Link></div>
    </aside>
    <div className="min-w-0"><MobileHeader active={active}/><main className="mx-auto max-w-[1192px] p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div>;
}

export function PortalHeader({ title, description }: { title: string; description: string }) { return <header><p className="text-xs font-semibold tracking-[.15em] text-primary">СУРАГЧИЙН ХЭСЭГ</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">{title}</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></header>; }
function Brand() { return <Link href="/" className="flex items-center gap-2.5 px-2 pb-4 pt-1 text-lg font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">∑</span>EzMath</Link>; }
function Navigation({ active }: { active: string }) { return <nav aria-label="Сурагчийн цэс" className="mt-2 space-y-1">{items.map(([label,href,Icon])=><Link key={href} href={href} aria-current={active===href ? "page" : undefined} className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium ${active===href?"bg-primary/10 text-primary":"text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon size={17}/>{label}</Link>)}</nav>; }
function MobileHeader({ active }: { active: string }) { return <header className="relative flex h-16 items-center border-b bg-white px-4 lg:hidden"><Brand/><details className="group ml-auto"><summary aria-label="Сурагчийн цэс нээх" className="list-none rounded-lg p-2 [&::-webkit-details-marker]:hidden"><Menu size={21}/></summary><div className="absolute left-0 right-0 top-full z-40 border-y bg-white p-3 shadow-lg"><Navigation active={active}/></div></details></header>; }
