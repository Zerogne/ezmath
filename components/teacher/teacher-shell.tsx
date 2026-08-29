import { GraduationCap, LayoutDashboard, LogOut, School } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { AppPortalShell } from "@/components/dashboard/app-portal-shell";

const items = [["Хяналтын самбар", "/teacher", LayoutDashboard]] as const;

export function TeacherShell({ children, name, schoolName = "Amjilt Cyber" }: { children: React.ReactNode; name: string; schoolName?: string }) {
  const footer = <div className="rounded-[14px] bg-[#0b1030] p-4 text-white"><div className="flex items-center gap-2"><GraduationCap size={17} className="text-emerald-400"/><p className="truncate text-sm font-semibold">{name}</p></div><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><School size={13}/>{schoolName}</p><form action={signOut}><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-2 text-xs font-semibold hover:bg-white/10"><LogOut size={14}/>Гарах</button></form></div>;
  return <AppPortalShell active="/teacher" items={items} navigationLabel="Багшийн цэс" footer={footer}>{children}</AppPortalShell>;
}
