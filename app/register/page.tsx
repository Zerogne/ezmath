import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
export const metadata: Metadata = { title: "Бүртгүүлэх" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <AuthCard mode="register" nextPath={nextPath}/>;
}
