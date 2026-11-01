import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminIdentity } from "@/lib/admin/auth";
import { countPendingPayments } from "@/lib/admin/data";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const admin = await getAdminIdentity(); if (!admin) redirect("/login?next=/admin&reason=admin"); const pendingPayments = await countPendingPayments(); return <AdminShell adminName={admin.name} pendingPayments={pendingPayments}>{children}</AdminShell>; }
