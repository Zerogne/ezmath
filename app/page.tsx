import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { FigmaLanding } from "@/components/home/figma-landing";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) { const { payment } = await searchParams; return <><Navbar/><FigmaLanding paymentStatus={payment}/></>; }
