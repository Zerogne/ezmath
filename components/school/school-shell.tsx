import { BookOpen, Building2, Settings } from "lucide-react";
import { AppPortalShell } from "@/components/dashboard/app-portal-shell";
import { PortalAccountCard } from "@/components/dashboard/portal-account-card";

const items = [["Сургуулийн хяналт", "/school", Building2], ["Бодлогын сан", "/school/library", BookOpen], ["Тохиргоо", "/school/settings", Settings]] as const;

export function SchoolShell({ children, name, schoolName, active = "/school" }: { children: React.ReactNode; name: string; schoolName: string; active?: string }) {
  return <AppPortalShell active={active} items={items} navigationLabel="Сургуулийн цэс" footer={<PortalAccountCard label="Сургууль" title={schoolName} subtitle={name}/>}>{children}</AppPortalShell>;
}
