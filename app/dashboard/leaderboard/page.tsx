import type { Metadata } from "next";
import Link from "next/link";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { portalCard } from "@/components/dashboard/portal-ui";
import { LeaderboardTable } from "@/components/dashboard/leaderboard";
import { EmptyState } from "@/components/ui/empty-state";
import { getStudentLeaderboards } from "@/lib/data/leaderboard";

export const metadata: Metadata = { title: "Шилдэгүүд" };

export default async function LeaderboardPage() {
  const boards = await getStudentLeaderboards();
  return <PortalShell active="/dashboard/leaderboard">
    <PortalHeader title="Шилдэгүүд" description="Энэ 7 хоногт (Даваа гарагаас хойш) зөв бодсон бодлогын тоогоор. Сорил, бодлогын сан, ангийн шалгалт бүгд тооцогдоно."/>
    {boards.length ? <div className="mt-6 grid gap-4 lg:grid-cols-2">{boards.map((board) => <section key={board.key} className={`${portalCard} p-5 sm:p-6`}>
      <p className="text-[11px] font-bold tracking-[0.14em] text-[#2B4BE8]">{board.scope === "school" ? "СУРГУУЛЬ" : "АНГИ"}</p>
      <h2 className="mt-1 font-sans text-lg font-semibold tracking-normal">{board.title}</h2>
      <p className="mt-0.5 text-[13px] text-[#5B6275]">{board.rows.length} сурагч</p>
      <div className="mt-3"><LeaderboardTable rows={board.rows} limit={50}/></div>
    </section>)}</div>
      : <EmptyState className="mt-6" heading="h2" pose="wave" title="Ангид нэгдээд өрсөлдөөрэй" text="Шилдэгүүдийн жагсаалт нь анги болон сургуулийнхаа сурагчидтай харьцуулна. Багшаасаа ангийн код аваад нэгдээрэй." action={<Link href="/dashboard/classes" className="inline-flex h-11 items-center justify-center rounded-full bg-[#0B1030] px-5 text-sm font-semibold text-white">Ангид нэгдэх</Link>}/>}
  </PortalShell>;
}
