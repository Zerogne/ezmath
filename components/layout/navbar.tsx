import Link from "next/link";
import { ChevronDown, LogOut, Menu, ShieldCheck, UserRound } from "lucide-react";
import { cache, Suspense } from "react";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/auth/actions";

const links = [ { href: "/tests?exam=SAT", label: "SAT" }, { href: "/tests?exam=EYESH", label: "ЭЕШ" }, { href: "/lesson", label: "Онолын хичээл" }, { href: "/pricing", label: "Үнэ" },];

export function Navbar() {
  return <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur"><div className="container-page flex h-[79px] items-center gap-8"><Brand/><nav className="hidden items-center gap-1 lg:flex" aria-label="Үндсэн цэс"><NavigationLinks/></nav><div className="ml-auto hidden items-center gap-2 lg:flex"><Suspense fallback={<AccountFallback/>}><AccountActions/></Suspense></div><details className="group ml-auto lg:hidden"><summary className="list-none rounded-lg p-2 [&::-webkit-details-marker]:hidden" aria-label="Цэс нээх"><Menu/></summary><div className="absolute left-0 right-0 top-[79px] border-t bg-white shadow-lg"><nav className="container-page grid gap-1 py-3" aria-label="Гар утасны цэс"><NavigationLinks/><div className="mt-2 border-t pt-3"><Suspense fallback={<AccountFallback/>}><AccountActions/></Suspense></div></nav></div></details></div></header>;
}

function Brand(){return <Link href="/" className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-base text-white">∑</span>EzMath</Link>}
function NavigationLinks(){return <>{links.map(link=><Link key={link.label} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{link.label}</Link>)}</>}
function AccountFallback(){return <span className="block h-10 w-36 animate-pulse rounded-xl bg-muted"/>}

export const getIdentity = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { email: user.email ?? "Хэрэглэгч", role: profile?.role === "admin" ? "admin" as const : "student" as const };
});

async function AccountActions(){const identity=await getIdentity();return identity?<ProfileMenu identity={identity}/>:<><ButtonLink href="/login" variant="ghost" size="sm">Нэвтрэх</ButtonLink><ButtonLink href="/register" size="sm">Бүртгүүлэх</ButtonLink></>}

export function ProfileMenu({ identity }: { identity: { email: string; role: "student" | "admin" } }) {
  return <details className="group relative"><summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border bg-white px-3 text-sm font-semibold transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-primary"><UserRound size={15}/></span><span className="hidden sm:inline">Профайл</span><ChevronDown size={15} className="text-muted-foreground transition-transform group-open:rotate-180"/></summary><div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border bg-white shadow-xl"><div className="border-b px-4 py-4"><p className="text-xs font-medium text-muted-foreground">{identity.role === "admin" ? "Админ профайл" : "Сурагчийн профайл"}</p><p className="mt-1 truncate text-sm font-semibold">{identity.email}</p></div><div className="p-2">{identity.role === "student" && <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"><UserRound size={17} className="text-muted-foreground"/>Хяналтын самбар</Link>}{identity.role === "admin" && <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"><ShieldCheck size={17} className="text-muted-foreground"/>Админ хэсэг</Link>}<form action={signOut}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50" type="submit"><LogOut size={17}/>Гарах</button></form></div></div></details>;
}
