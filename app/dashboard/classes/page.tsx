import type { Metadata } from "next";
import { BookOpen, LogOut, Users } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { getStudentClasses } from "@/lib/data/classrooms";
import { joinClass, leaveClass } from "./actions";

export const metadata: Metadata = { title: "Миний анги" };

const errors: Record<string, string> = { "invalid-code": "Ангийн кодоо зөв оруулна уу.", "not-found": "Ийм кодтой анги олдсонгүй.", "wrong-school": "Энэ анги өөр сургуульд харьяалагдаж байна.", "join-failed": "Ангид нэгдэж чадсангүй. Дахин оролдоно уу." };

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ error?: string; joined?: string }> }) {
  const [classes, query] = await Promise.all([getStudentClasses(), searchParams]);
  return <PortalShell active="/dashboard/classes"><PortalHeader title="Миний анги" description="Багшаасаа авсан кодоор ангид нэгдэж, ахицаа багштайгаа хуваалцаарай."/>
    <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">{classes.length ? classes.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Users size={20}/></span><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{item.name}</h2><p className="mt-1 text-sm text-muted-foreground">Багш: {item.teacherName}</p><p className="mt-3 font-mono text-sm font-bold tracking-[.18em] text-primary">{item.code}</p></div><form action={leaveClass}><input type="hidden" name="classroomId" value={item.id}/><button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><LogOut size={14}/>Гарах</button></form></div></article>) : <div className="rounded-2xl border bg-white px-6 py-14 text-center"><BookOpen className="mx-auto text-muted-foreground"/><h2 className="mt-4 text-lg font-semibold">Одоогоор ангигүй байна</h2><p className="mt-2 text-sm text-muted-foreground">Баруун талд багшийн өгсөн кодыг оруулна уу.</p></div>}</div>
      <aside className="h-fit rounded-2xl border bg-white p-5 sm:p-6"><h2 className="font-semibold">Ангид нэгдэх</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Багшийн өгсөн 7 оронтой кодыг оруулна.</p>{query.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors[query.error] ?? errors["join-failed"]}</p>}{query.joined && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Ангид амжилттай нэгдлээ.</p>}<form action={joinClass} className="mt-5"><label className="text-sm font-medium" htmlFor="class-code">Ангийн код</label><input id="class-code" name="code" required minLength={6} maxLength={10} autoCapitalize="characters" placeholder="Жишээ: EZM7K2P" className="mt-2 h-12 w-full rounded-xl border px-4 font-mono uppercase tracking-[.16em]"/><button className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white">Нэгдэх</button></form></aside>
    </section>
  </PortalShell>;
}
