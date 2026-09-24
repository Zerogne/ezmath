import type { Metadata } from "next";
import { ClassExamTake } from "@/components/exam/class-exam-take";
import { getStudentClassExamForTake } from "@/lib/data/class-exams";

export const metadata: Metadata = { title: "Шалгалт өгч байна", robots: { index: false, follow: false } };

export default async function TakeClassExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const data = await getStudentClassExamForTake(examId);
  return <ClassExamTake exam={data.exam} submission={data.submission}/>;
}
