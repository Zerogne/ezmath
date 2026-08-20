"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "@/app/auth/actions";

const links = [{ href: "/", label: "Нүүр" }, { href: "/tests?exam=SAT", label: "SAT" }, { href: "/tests?exam=EYESH", label: "ЭЕШ" }, { href: "/#programs", label: "Онолын хичээл" }, { href: "/#pricing", label: "Үнэ" }, { href: "/#about", label: "Бидний тухай" }];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const configured = isSupabaseConfigured();
  const [identity, setIdentity] = useState<{ email: string; role: "student" | "admin" } | null | undefined>(configured ? undefined : null);
  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIdentity(null); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      setIdentity({ email: user.email ?? "Хэрэглэгч", role: profile?.role === "admin" ? "admin" : "student" });
    };
    void load();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => listener.subscription.unsubscribe();
  }, [configured]);
  const accountActions = identity ? <ProfileMenu identity={identity}/> : <><ButtonLink href="/login" variant="ghost" size="sm">Нэвтрэх</ButtonLink><ButtonLink href="/register" size="sm">Бүртгүүлэх</ButtonLink></>;
  return <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
    <div className="container-page flex h-[79px] items-center gap-8">
      <Link href="/" className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-base text-white">∑</span>EzMath</Link>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Үндсэн цэс">{links.map((link) => <Link key={link.label} href={link.href} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{link.label}</Link>)}</nav>
      <div className="ml-auto hidden items-center gap-2 lg:flex">
        {accountActions}
      </div>
      <button className="ml-auto rounded-lg p-2 lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Цэс нээх">{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="container-page grid gap-1 border-t py-3 lg:hidden">{links.map((link) => <Link key={link.label} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">{link.label}</Link>)}<div className="mt-2 border-t pt-3">{accountActions}</div></nav>}
  </header>;
}

function ProfileMenu({ identity }: { identity: { email: string; role: "student" | "admin" } }) {
  return <details className="group relative">
    <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border bg-white px-3 text-sm font-semibold transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-primary"><UserRound size={15}/></span>
      <span className="hidden sm:inline">Профайл</span>
      <ChevronDown size={15} className="text-muted-foreground transition-transform group-open:rotate-180"/>
    </summary>
    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border bg-white shadow-xl">
      <div className="border-b px-4 py-4">
        <p className="text-xs font-medium text-muted-foreground">{identity.role === "admin" ? "Админ профайл" : "Сурагчийн профайл"}</p>
        <p className="mt-1 truncate text-sm font-semibold">{identity.email}</p>
      </div>
      <div className="p-2">
        {identity.role === "student" && <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"><UserRound size={17} className="text-muted-foreground"/>Хяналтын самбар</Link>}
        {identity.role === "admin" && <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted"><ShieldCheck size={17} className="text-muted-foreground"/>Админ хэсэг</Link>}
        <form action={signOut}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50" type="submit"><LogOut size={17}/>Гарах</button></form>
      </div>
    </div>
  </details>;
}
