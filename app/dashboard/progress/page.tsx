import type { Metadata } from "next";
import { PortalShell } from "@/components/dashboard/portal-shell";
import { HistoryOverview } from "@/components/history/history-overview";
import { getPortalData } from "@/lib/data/student-portal";

export const metadata: Metadata = { title: "Явцын тайлан" };

export default async function ProgressPage() {
  const data = await getPortalData();
  return <PortalShell active="/dashboard/progress"><HistoryOverview attempts={data.attempts}/></PortalShell>;
}
