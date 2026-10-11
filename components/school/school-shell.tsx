
import { BookOpen, Building2, GraduationCap, LogOut, Settings } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { AppPortalShell } from "@/components/dashboard/app-portal-shell";
const items = [["Сургуулийн хяналт", "/school", Building2], ["Бодлогын сан", "/school/library", BookOpen], ["Тохиргоо", "/school/settings", Settings]] as const;
export function SchoolShell({ children, name, schoolName, active = "/school" }: { children: React.ReactNode; name: string; schoolName: string; active?: string }) { const footer = <div className="rounded-[14px] bg-[#0b1030] p-4 text-white"><div className="flex items-center gap-2"><GraduationCap size={17} className="text-emerald-400"/><p className="truncate text-sm font-semibold">{schoolName}</p></div><p className="mt-2 truncate text-xs text-slate-400">{name}</p><form action={signOut}><button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 py-2 text-xs font-semibold hover:bg-white/10"><LogOut size={14}/>Гарах</button></form></div>; return <AppPortalShell active={active} items={items} navigationLabel="Сургуулийн цэс" footer={footer}>{children}</AppPortalShell>; }

