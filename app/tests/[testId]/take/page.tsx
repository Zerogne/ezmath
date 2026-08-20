import { notFound } from "next/navigation";
import { ExamShell } from "@/components/exam/exam-shell";
import { findPublishedTest, loadStudentQuestions } from "@/lib/data/test-repository";
export default async function TakeTestPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const [test, questions] = await Promise.all([findPublishedTest(testId), loadStudentQuestions(testId)]); if (!test) notFound(); return <ExamShell test={test} questions={questions}/>; }
