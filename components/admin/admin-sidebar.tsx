"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BookOpen, CreditCard, GraduationCap, LayoutDashboard, LibraryBig, School, Users } from "lucide-react";
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
      <SidebarHeader className="border-b px-5 py-[18px]">
        <Link href="/admin" className="text-base font-bold"><span className="text-primary">Ez</span>Math</Link>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">Admin</p>
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
                      <SidebarMenuButton asChild isActive={active} className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold">
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
