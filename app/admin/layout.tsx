import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminIdentity } from "@/lib/admin/auth";
export default async function AdminLayout({ children }: { children: React.ReactNode }) { const admin = await getAdminIdentity(); if (!admin) redirect("/login?next=/admin&reason=admin"); return <AdminShell adminName={admin.name}>{children}</AdminShell>; }
