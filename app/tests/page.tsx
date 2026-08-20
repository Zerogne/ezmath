import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { TestFilter } from "@/components/tests/test-filter";
import { listPublishedTests } from "@/lib/data/test-repository";
import type { ExamType } from "@/types/exam";

export const metadata: Metadata = { title: "Шалгалтууд" };
export default async function TestsPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const { exam } = await searchParams;
  const tests = await listPublishedTests();
  const initialExam = exam === "SAT" || exam === "EYESH" ? exam as ExamType : "ALL";
  return <><Navbar/><main className="container-page py-12 sm:py-16"><p className="eyebrow">Шалгалтын сан</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Шалгалтууд</h1><p className="mt-3 max-w-2xl text-muted-foreground">Бүтэн жишиг шалгалт, сэдэвчилсэн дасгал болон ЭЕШ-ийн өмнөх оны материалуудаас сонгоорой.</p><div className="mt-10"><TestFilter tests={tests} initialExam={initialExam}/></div></main></>;
}
