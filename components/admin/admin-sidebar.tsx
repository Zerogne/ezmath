"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, CreditCard, GraduationCap, LayoutDashboard, LibraryBig, School, Users } from "lucide-react";
import { Logo } from "@/components/layout/logo";
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

export function AdminSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnNavigate = () => { if (isMobile) setOpenMobile(false); };
  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="border-b px-4 py-3.5">
        <div className="flex items-center gap-2"><Logo href="/admin" size={34} className="text-lg"/><span className="rounded-md bg-[#F1F3F8] px-[7px] py-[3px] text-[10px] font-semibold uppercase tracking-[.14em] text-[#5B6275]">Admin</span></div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.links.map(({ href, label, icon: Icon }) => {
                  const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild isActive={active} className="rounded-xl data-[active=true]:bg-[#E8EEFF] data-[active=true]:font-semibold data-[active=true]:text-[#2B4BE8]">
                        <Link href={href} onClick={closeOnNavigate}><Icon size={17} />{label}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/"><ArrowLeft size={17} />Сурагчийн сайт</Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
