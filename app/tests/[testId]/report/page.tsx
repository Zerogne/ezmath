import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TestReport } from "@/components/reports/test-report";
import { findPublishedTest, loadStudentQuestions } from "@/lib/data/test-repository";
export default async function ReportPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const [test, questions] = await Promise.all([findPublishedTest(testId), loadStudentQuestions(testId)]); if (!test) notFound(); return <><Navbar/><main className="container-page py-10 sm:py-14"><TestReport test={test} questions={questions}/></main></>; }
