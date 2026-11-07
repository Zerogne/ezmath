import Link from "next/link";
import { ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { cache, Suspense } from "react";
import { Logo } from "@/components/layout/logo";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/auth/actions";

const links = [["ЭЕШ", "/tests?exam=EYESH"], ["SAT", "/tests?exam=SAT"], ["Онолын хичээл", "/lesson"], ["Үнэ", "/pricing"]] as const;

/** Site header shared by the homepage and every public page; `bordered` adds a hairline under it for pages that don't open on a hero. */
export function Navbar({ bordered = true }: { bordered?: boolean }) {
  return <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur ${bordered ? "border-b border-[#EEF0F6]" : ""}`}><div className="container-page flex h-[72px] items-center gap-10">
    <Logo/>
    <nav className="ml-auto hidden items-center gap-8 text-[15px] font-medium text-[#333A4D] lg:flex" aria-label="Үндсэн цэс"><NavigationLinks/></nav>
    <div className="hidden lg:block"><Suspense fallback={<AccountFallback/>}><AccountActions/></Suspense></div>
    <MobileMenu label="Цэс" top="72px" className="ml-auto lg:hidden">
      <nav className="container-page grid gap-1 py-4 text-[16px] font-medium text-[#333A4D]" aria-label="Гар утасны цэс"><NavigationLinks mobile/><div className="menu-item mt-2 border-t border-[#EEF0F6] pt-4" style={{ "--i": links.length } as React.CSSProperties}><Suspense fallback={<AccountFallback/>}><AccountActions/></Suspense></div></nav>
    </MobileMenu>
  </div></header>;
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) { return <>{links.map(([label, href], index) => <Link key={href} href={href} style={mobile ? { "--i": index } as React.CSSProperties : undefined} className={mobile ? "menu-item rounded-xl px-3 py-3 active:bg-[#F1F3F8]" : "hover:text-[#0B1030]"}>{label}{href === "/lesson" && <span className="ml-1.5 rounded-full bg-[#2B4BE8] px-[7px] py-0.5 align-[2px] text-[10px] font-semibold text-white">Шинэ</span>}</Link>)}</>; }
function AccountFallback() { return <span className="block h-10 w-40 animate-pulse rounded-xl bg-[#F1F3F8]"/>; }

export const getIdentity = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { email: user.email ?? "Хэрэглэгч", role: profile?.role === "admin" ? "admin" as const : "student" as const };
});

async function AccountActions() {
  const identity = await getIdentity();
  if (identity) return <ProfileMenu identity={identity}/>;
  return <div className="flex gap-2"><Link href="/login" className="rounded-[10px] bg-[#F1F3F8] px-3.5 py-2 text-sm font-medium text-[#5B6275] hover:text-[#0B1030]">Нэвтрэх</Link><Link href="/register" className="rounded-[10px] bg-[#0B1030] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1A2150]">Бүртгүүлэх</Link></div>;
}

export function ProfileMenu({ identity }: { identity: { email: string; role: "student" | "admin" } }) {
  return <details className="group relative"><summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border-2 border-[#EEF0F6] bg-white pl-1.5 pr-3 text-sm font-semibold transition-colors hover:border-[#C9CDDA] [&::-webkit-details-marker]:hidden"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8EEFF] text-[#2B4BE8]"><UserRound size={15}/></span><span className="hidden sm:inline">Профайл</span><ChevronDown size={15} className="text-muted-foreground transition-transform group-open:rotate-180"/></summary><div className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-[18px] animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 motion-reduce:animate-none border-2 border-[#EEF0F6] bg-white shadow-[0_18px_40px_-16px_rgba(11,16,48,.3)]"><div className="border-b px-4 py-4"><p className="text-xs font-medium text-muted-foreground">{identity.role === "admin" ? "Админ профайл" : "Сурагчийн профайл"}</p><p className="mt-1 truncate text-sm font-semibold">{identity.email}</p></div><div className="p-2">{identity.role === "student" && <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"><UserRound size={17} className="text-muted-foreground"/>Хяналтын самбар</Link>}{identity.role === "admin" && <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"><ShieldCheck size={17} className="text-muted-foreground"/>Админ хэсэг</Link>}<form action={signOut}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50" type="submit"><LogOut size={17}/>Гарах</button></form></div></div></details>;
}
