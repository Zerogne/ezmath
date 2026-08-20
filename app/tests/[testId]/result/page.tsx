import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ResultSummary } from "@/components/exam/result-summary";
import { findPublishedTest } from "@/lib/data/test-repository";
export default async function ResultPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const test = await findPublishedTest(testId); if (!test) notFound(); return <><Navbar/><main className="container-page max-w-3xl py-12 sm:py-20"><ResultSummary test={test}/></main></>; }
