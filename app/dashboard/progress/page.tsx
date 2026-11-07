import type { Metadata } from "next";
import Link from "next/link";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { btnSmDark } from "@/components/dashboard/portal-ui";
import { HistoryOverview } from "@/components/history/history-overview";
import { EmptyState } from "@/components/ui/empty-state";
import { getPortalData } from "@/lib/data/student-portal";

export const metadata: Metadata = { title: "Явцын тайлан" };

export default async function ProgressPage() {
  const data = await getPortalData();
  return <PortalShell active="/dashboard/progress" plan={data.plan}>{data.plan.code === "free" ? <LockedProgress/> : <HistoryOverview attempts={data.attempts}/>}</PortalShell>;
}

function LockedProgress() {
  return <><PortalHeader title="Явцын тайлан" description="Онооны задаргаа, сэдэв тус бүрийн ахиц болон хувийн зөвлөмж."/><EmptyState className="mt-6" heading="h2" pose="trophy" title="Дэлгэрэнгүй явцын тайлан" text="Багцгүй эрхээр шалгалт өгөх боломжтой ч онооны задаргаа, сэдэв тус бүрийн ахиц болон хувийн зөвлөмж зөвхөн төлбөртэй багцад нээгдэнэ." action={<Link href="/pricing" className={btnSmDark}>Багц сонгох</Link>}/></>;
}
