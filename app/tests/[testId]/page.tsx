import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { TestIntro } from "@/components/tests/test-intro";
import { tests } from "@/lib/data/mock-tests";
import { findPublishedTest } from "@/lib/data/test-repository";
import { SiteFooter } from "@/components/layout/site-footer";
export function generateStaticParams() { return tests.map((test) => ({ testId: test.id })); }
type TestPageProps = { params: Promise<{ testId: string }> };

/** "ЭЕШ 2024 Математик · Хувилбар A": the words students actually search for past papers with. */
export async function generateMetadata({ params }: TestPageProps): Promise<Metadata> {
  const { testId } = await params;
  const test = await findPublishedTest(testId);
  if (!test) return { title: "Сорил олдсонгүй", robots: { index: false } };
  const exam = test.examType === "SAT" ? "SAT" : "ЭЕШ";
  const parts = [exam, test.year, test.subject, test.variant && `хувилбар ${test.variant}`].filter(Boolean).join(" ");
  const title = test.type === "previous-year" && test.year ? `${parts} — онлайн бодох, хариу` : test.title;
  const description = test.type === "previous-year" && test.year
    ? `${exam} ${test.year} оны ${test.subject.toLowerCase()} шалгалт${test.variant ? `ын ${test.variant} хувилбар` : ""}: ${test.questionCount} бодлого, ${test.durationMinutes} минут. Онлайн бодоод оноо, зөв хариу, сэдвийн тайлангаа шууд аваарай.`
    : `${test.title}: ${test.questionCount} бодлого, ${test.durationMinutes} минут. ${exam}-д бэлдэх онлайн сорил, оноо болон сэдвийн тайлантай.`;
  return { title, description, alternates: { canonical: `/tests/${test.id}` }, openGraph: { title, description, url: `/tests/${test.id}` } };
}

export default async function TestPage({ params }: TestPageProps) { const { testId } = await params; const test = await findPublishedTest(testId); if (!test) notFound(); return <><Navbar/><TestIntro test={test}/><SiteFooter/></>; }
