import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminIdentity } from "@/lib/admin/auth";
import { countPendingPayments } from "@/lib/admin/data";
export const metadata: Metadata = { title: "Админ", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) { await connection(); /* always per request: admin data must never be prerendered */ const admin = await getAdminIdentity(); if (!admin) redirect("/login?next=/admin&reason=admin"); const pendingPayments = await countPendingPayments(); return <AdminShell adminName={admin.name} pendingPayments={pendingPayments}>{children}</AdminShell>; }
