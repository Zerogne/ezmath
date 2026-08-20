import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
export const metadata: Metadata = { title: "Нэвтрэх" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const { next, reason } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <AuthCard mode="login" nextPath={nextPath} reason={reason}/>;
}
