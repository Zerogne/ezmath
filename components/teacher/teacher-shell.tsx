import Link from "next/link";
import { GraduationCap, LayoutDashboard } from "lucide-react";
import { signOut } from "@/app/auth/actions";

export function TeacherShell({ children, name }: { children: React.ReactNode; name: string }) {
  return <div className="min-h-screen bg-[#f6f7fb]"><header className="border-b bg-white"><div className="mx-auto flex h-16 max-w-[1240px] items-center gap-4 px-4 sm:px-6"><Link href="/teacher" className="flex items-center gap-2.5 text-lg font-semibold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">∑</span>EzMath</Link><nav className="ml-6 hidden sm:block"><Link href="/teacher" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><LayoutDashboard size={16}/>Багшийн самбар</Link></nav><div className="ml-auto flex items-center gap-3"><span className="hidden items-center gap-2 text-sm sm:flex"><GraduationCap size={17} className="text-primary"/>{name}</span><form action={signOut}><button className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">Гарах</button></form></div></div></header><main className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 sm:py-9">{children}</main></div>;
}
