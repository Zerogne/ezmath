import { BookOpen, LayoutDashboard } from "lucide-react";
import { AppPortalShell } from "@/components/dashboard/app-portal-shell";
import { PortalAccountCard } from "@/components/dashboard/portal-account-card";

const items = [["Хяналтын самбар", "/teacher", LayoutDashboard], ["Бодлогын сан", "/teacher/library", BookOpen]] as const;

export function TeacherShell({ children, name, schoolName = "Amjilt Cyber", active = "/teacher" }: { children: React.ReactNode; name: string; schoolName?: string; active?: string }) {
  return <AppPortalShell active={active} items={items} navigationLabel="Багшийн цэс" footer={<PortalAccountCard label="Багш" title={name} subtitle={schoolName} pose="point"/>}>{children}</AppPortalShell>;
}
