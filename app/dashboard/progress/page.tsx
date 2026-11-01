import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { HistoryOverview } from "@/components/history/history-overview";
import { getPortalData } from "@/lib/data/student-portal";

export const metadata: Metadata = { title: "Явцын тайлан" };

export default async function ProgressPage() {
  const data = await getPortalData();
  return <PortalShell active="/dashboard/progress">{data.plan.code === "free" ? <LockedProgress/> : <HistoryOverview attempts={data.attempts}/>}</PortalShell>;
}

function LockedProgress(){return <section className="rounded-3xl border bg-white px-6 py-16 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Lock size={21}/></span><h1 className="mt-5 text-2xl font-semibold">Дэлгэрэнгүй явцын тайлан</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Үнэгүй эрхээр шалгалт өгөх боломжтой ч онооны задаргаа, сэдэв тус бүрийн ахиц болон хувийн зөвлөмж зөвхөн төлбөртэй багцад нээгдэнэ.</p><Link href="/pricing" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Багц сонгох</Link></section>}
