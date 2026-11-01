import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { TestFilter } from "@/components/tests/test-filter";
import { listPublishedTests } from "@/lib/data/test-repository";
import type { ExamType } from "@/types/exam";
import { PageHero } from "@/components/layout/page-hero";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = { title: "Бүх шалгалт нэг дор" };
export default async function TestsPage({ searchParams }: { searchParams: Promise<{ exam?: string }> }) {
  const { exam } = await searchParams;
  const tests = await listPublishedTests();
  const initialExam = exam === "SAT" || exam === "EYESH" ? exam as ExamType : "ALL";
  return <><Navbar/><main className="container-page py-12 sm:py-16"><PageHero chip="Шалгалтын сан" chipIcon="∑" title="Бүх шалгалт нэг дор" text="SAT, ЭЕШ болон сэдэвчилсэн дасгалуудаас сонгон мэдлэгээ сорьж, ахицаа үнэлээрэй." pose="laptop"/><div className="mt-10"><TestFilter tests={tests} initialExam={initialExam}/></div></main><SiteFooter/></>;
}
