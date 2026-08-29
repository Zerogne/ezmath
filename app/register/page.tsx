import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { listActiveSchools } from "@/lib/data/active-schools";
export const metadata: Metadata = { title: "Бүртгүүлэх" };
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, schools] = await Promise.all([searchParams, listActiveSchools()]);
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : undefined;
  return <AuthCard mode="register" nextPath={nextPath} schools={schools}/>;
}
