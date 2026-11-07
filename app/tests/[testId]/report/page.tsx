import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { TestReport } from "@/components/reports/test-report";
import { findPublishedTest, loadStudentQuestions } from "@/lib/data/test-repository";
import { getPortalData } from "@/lib/data/student-portal";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteFooter } from "@/components/layout/site-footer";
export default async function ReportPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const [test, questions, portal] = await Promise.all([findPublishedTest(testId), loadStudentQuestions(testId), getPortalData()]); if (!test) notFound(); return <><Navbar/><main className="bg-gradient-to-b from-white to-[#F6F7FB]"><div className="container-page py-10 sm:py-14">{portal.plan.code === "free" ? <EmptyState heading="h1" pose="think" title="Дэлгэрэнгүй тайлан багцад багтана" text="Зөв, буруу хариултын тайлбар болон сэдэвчилсэн анализыг харахын тулд багц сонгоно уу." action={<Link href="/pricing" className="btn-dark">Багц сонгох</Link>}/> : <TestReport test={test} questions={questions}/>}</div></main><SiteFooter/></>; }
