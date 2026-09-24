import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { safeNextPath } from "@/lib/auth/safe-next";
export const metadata: Metadata = { title: "Нэвтрэх" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const { next, reason } = await searchParams;
  const nextPath = safeNextPath(next);
  return <AuthCard mode="login" nextPath={nextPath} reason={reason}/>;
}
