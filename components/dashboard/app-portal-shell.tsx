import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";

export type PortalNavItem = readonly [label: string, href: string, icon: LucideIcon];

/** Sidebar layout shared by the student, teacher and school portals (Figma 37:2). */
export function AppPortalShell({ active, items, navigationLabel, children, footer, mobileBottomNavigation, mobileAction }: { active: string; items: readonly PortalNavItem[]; navigationLabel: string; children: React.ReactNode; footer?: React.ReactNode; mobileBottomNavigation?: React.ReactNode; mobileAction?: React.ReactNode }) {
  return <div className={`min-h-screen bg-[#F6F7FB] text-[#0B1030] lg:grid lg:grid-cols-[256px_minmax(0,1fr)] ${mobileBottomNavigation ? "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0" : ""}`}>
    <div className="hidden border-r-2 border-[#EEF0F6] bg-white lg:block"><aside className="sticky top-0 flex h-screen flex-col gap-1 overflow-y-auto px-4 py-[22px]">
      <Logo size={40} className="px-2 pb-[18px] text-[22px] !font-bold"/>
      <Navigation active={active} items={items} label={navigationLabel}/>
      {footer && <div className="mt-auto">{footer}</div>}
    </aside></div>
    <div className="min-w-0">
      <header className="sticky top-0 z-40 flex h-16 items-center border-b-2 border-[#EEF0F6] bg-white px-4 lg:hidden">
        <Logo size={34} className="text-xl"/>
        {mobileAction ? <div className="ml-auto">{mobileAction}</div> : !mobileBottomNavigation && <MobileMenu label={navigationLabel} top="64px" className="ml-auto"><div className="p-3"><Navigation active={active} items={items} label={navigationLabel} stagger/></div></MobileMenu>}
      </header>
      <main className="mx-auto max-w-[1184px] p-4 sm:p-6 lg:px-9 lg:pb-10 lg:pt-7">{children}</main>
    </div>
    {mobileBottomNavigation}
  </div>;
}

function Navigation({ active, items, label, stagger = false }: { active: string; items: readonly PortalNavItem[]; label: string; stagger?: boolean }) {
  return <nav aria-label={label} className="space-y-1">{items.map(([text, href, Icon], index) => <Link key={href} href={href} style={stagger ? { "--i": index } as React.CSSProperties : undefined} aria-current={active === href ? "page" : undefined} className={`${stagger ? "menu-item " : ""}flex items-center gap-3 rounded-xl px-3 py-[11px] text-sm ${active === href ? "bg-[#E8EEFF] font-semibold text-[#2B4BE8]" : "font-medium text-[#5B6275] hover:bg-[#F7F8FC] hover:text-[#0B1030]"}`}><Icon size={18}/>{text}</Link>)}</nav>;
}
