"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, CreditCard, GraduationCap, LayoutDashboard, LibraryBig, School, Users } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Ezi } from "@/components/home/redesign/illustrations";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const groups = [
  { label: "Ерөнхий", links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Удирдлага", links: [{ href: "/admin/students", label: "Сурагчид", icon: Users }, { href: "/admin/schools", label: "Сургуулиуд", icon: School }] },
  { label: "Материал", links: [{ href: "/admin/lessons", label: "Онолын хичээл", icon: LibraryBig }, { href: "/admin/materials/sat", label: "SAT", icon: BookOpen }, { href: "/admin/materials/eyesh", label: "ЭЕШ", icon: GraduationCap }] },
  { label: "Санхүү", links: [{ href: "/admin/payments", label: "Төлбөр", icon: CreditCard }] },
];

export function AdminSidebar({ adminName, pendingPayments = 0 }: { adminName: string; pendingPayments?: number }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnNavigate = () => { if (isMobile) setOpenMobile(false); };
  return (
    <Sidebar collapsible="offcanvas" className="border-r-2 border-[#EEF0F6] bg-white">
      <SidebarHeader className="px-4 pb-2 pt-[22px]">
        <div className="flex items-center gap-2 px-2"><Logo href="/admin" size={40} className="text-[22px] !font-bold" /><span className="rounded-full bg-[#0B1030] px-2 py-0.5 text-[10px] font-semibold text-white">Admin</span></div>
      </SidebarHeader>
      <SidebarContent className="gap-0 px-4">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel className="h-auto px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[.14em] text-[#9AA0B4]">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.links.map(({ href, label, icon: Icon }) => {
                  const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild isActive={active} className="h-auto gap-3 rounded-xl px-3 py-[11px] text-sm font-medium text-[#5B6275] hover:bg-[#F7F8FC] hover:text-[#0B1030] data-[active=true]:bg-[#E8EEFF] data-[active=true]:font-semibold data-[active=true]:text-[#2B4BE8] [&>svg]:size-[18px]">
                        <Link href={href} onClick={closeOnNavigate}><Icon />{label}{href === "/admin/payments" && pendingPayments > 0 && <span className="ml-auto rounded-full bg-[#FF6FA8] px-[7px] py-0.5 text-[11px] font-semibold text-white">{pendingPayments}</span>}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-4 pb-5">
        <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#EEF0F6] p-2.5">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-full bg-[#E8EEFF]"><Ezi size={38} /></span>
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{adminName}</p><p className="text-xs text-[#5B6275]">Админ</p></div>
          <Link href="/" onClick={closeOnNavigate} aria-label="Сурагчийн сайт руу" title="Сурагчийн сайт" className="grid h-8 w-8 place-items-center rounded-lg text-[#5B6275] hover:bg-[#F7F8FC] hover:text-[#0B1030]"><ArrowLeft size={16} /></Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
