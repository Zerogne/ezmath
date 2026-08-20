import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TestIntro } from "@/components/tests/test-intro";
import { tests } from "@/lib/data/mock-tests";
import { findPublishedTest } from "@/lib/data/test-repository";
export function generateStaticParams() { return tests.map((test) => ({ testId: test.id })); }
export default async function TestPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const test = await findPublishedTest(testId); if (!test) notFound(); return <><Navbar/><TestIntro test={test}/></>; }
