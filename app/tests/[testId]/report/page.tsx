import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { TestReport } from "@/components/reports/test-report";
import { findPublishedTest, loadStudentQuestions } from "@/lib/data/test-repository";
import { getPortalData } from "@/lib/data/student-portal";
export default async function ReportPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const [test, questions, portal] = await Promise.all([findPublishedTest(testId), loadStudentQuestions(testId), getPortalData()]); if (!test) notFound(); return <><Navbar/><main className="container-page py-10 sm:py-14">{portal.plan.code === "free" ? <div className="rounded-2xl border bg-white px-6 py-14 text-center"><Lock className="mx-auto text-primary"/><h1 className="mt-5 text-2xl font-bold">Дэлгэрэнгүй тайлан багцад багтана</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Зөв, буруу хариултын тайлбар болон сэдэвчилсэн анализыг харахын тулд Стандарт эсвэл Ментор+ багц сонгоно уу.</p><Link href="/#pricing" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">Багц сонгох</Link></div> : <TestReport test={test} questions={questions}/>}</main></>; }
