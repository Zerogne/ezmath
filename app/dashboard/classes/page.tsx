import type { Metadata } from "next";
import { LogOut, Trophy } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { ArtTile, btnSmDark, portalCard, portalInput, portalMuted } from "@/components/dashboard/portal-ui";
import { EmptyState } from "@/components/ui/empty-state";
import { ObjectArt } from "@/components/home/redesign/illustrations";
import { getStudentClasses } from "@/lib/data/classrooms";
import { getStudentClassLeaderboards } from "@/lib/data/leaderboard";
import { LeaderboardTable } from "@/components/dashboard/leaderboard";
import { joinClass, leaveClass } from "./actions";

export const metadata: Metadata = { title: "Миний анги" };

const errors: Record<string, string> = { "invalid-code": "Ангийн кодоо зөв оруулна уу.", "not-found": "Ийм кодтой анги олдсонгүй.", "wrong-school": "Энэ анги өөр сургуульд харьяалагдаж байна.", "join-failed": "Ангид нэгдэж чадсангүй. Дахин оролдоно уу." };
const tiles = ["#E8EEFF", "#EFE6FF", "#E9FBF2", "#FFF0E6"];

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ error?: string; joined?: string }> }) {
  const [classes, query] = await Promise.all([getStudentClasses(), searchParams]);
  const boards = new Map((await getStudentClassLeaderboards(classes)).map((board) => [board.key, board.rows]));
  return <PortalShell active="/dashboard/classes">
    <PortalHeader title="Миний анги" description="Багшаасаа авсан кодоор ангид нэгдэж, ахицаа багштайгаа хуваалцаарай."/>
    <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">{classes.length ? classes.map((item, index) => <article key={item.id} className={`${portalCard} p-5 sm:p-6`}><div className="flex flex-wrap items-center gap-4">
        <ArtTile kind="gradcap" bg={tiles[index % tiles.length]}/>
        <div className="min-w-0 flex-1"><h2 className="font-sans text-lg font-semibold tracking-normal">{item.name}</h2><p className={`mt-0.5 text-sm ${portalMuted}`}>Багш: {item.teacherName}</p><p className="mt-2 inline-flex rounded-lg bg-[#F6F7FB] px-2.5 py-1 font-mono text-sm font-bold tracking-[.18em] text-[#2B4BE8]">{item.code}</p></div>
        <form action={leaveClass}><input type="hidden" name="classroomId" value={item.id}/><button className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-[#FECACA] px-4 text-sm font-medium text-red-700 hover:bg-red-50"><LogOut size={14}/>Гарах</button></form></div>
        {boards.get(item.id) && <div className="mt-5 border-t-2 border-[#F4F5FA] pt-4"><h3 className="inline-flex items-center gap-2 font-sans text-base font-semibold tracking-normal"><Trophy size={17} className="text-[#F5B700]"/>Энэ 7 хоногийн шилдэг</h3><p className={`mt-0.5 text-[13px] ${portalMuted}`}>Даваа гарагаас хойш зөв бодсон бодлогоор. Сорил, бодлогын сан, ангийн шалгалт бүгд тооцогдоно.</p><div className="mt-2"><LeaderboardTable rows={boards.get(item.id)!} limit={10}/></div></div>}
      </article>) : <EmptyState title="Одоогоор ангигүй байна" text="Багшийн өгсөн кодыг баруун талд оруулж ангидаа нэгдээрэй." pose="wave" heading="h2"/>}</div>
      <aside className={`${portalCard} relative h-fit overflow-hidden p-6`}>
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-sans text-lg font-semibold tracking-normal">Ангид нэгдэх</h2><p className={`mt-1 text-sm leading-6 ${portalMuted}`}>Багшийн өгсөн 7 оронтой кодыг оруулна.</p></div><ObjectArt kind="gradcap" size={64}/></div>
        {query.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{errors[query.error] ?? errors["join-failed"]}</p>}
        {query.joined && <p role="status" className="mt-4 rounded-xl bg-[#E9FBF2] p-3 text-sm text-[#15803D]">Ангид амжилттай нэгдлээ.</p>}
        <form action={joinClass} className="mt-5"><label className="text-sm font-medium" htmlFor="class-code">Ангийн код</label><input id="class-code" name="code" required minLength={6} maxLength={10} autoCapitalize="characters" placeholder="Жишээ: EZM7K2P" className={`${portalInput} mt-2 font-mono uppercase tracking-[.16em] placeholder:font-sans placeholder:normal-case placeholder:tracking-normal`}/><button className={`${btnSmDark} mt-3 h-11 w-full`}>Нэгдэх</button></form>
      </aside>
    </section>
  </PortalShell>;
}
