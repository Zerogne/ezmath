import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ResultSummary } from "@/components/exam/result-summary";
import { findPublishedTest } from "@/lib/data/test-repository";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = { title: "Шалгалтын дүн", robots: { index: false, follow: false } };
export default async function ResultPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const test = await findPublishedTest(testId); if (!test) notFound(); return <><Navbar/><main className="bg-gradient-to-b from-white to-[#F6F7FB]"><div className="container-page py-10 sm:py-14"><ResultSummary test={test}/></div></main><SiteFooter/></>; }
