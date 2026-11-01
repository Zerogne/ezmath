import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Hourglass } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { formatScore } from "@/lib/class-exams/format";
import { getStudentClassExamResult } from "@/lib/data/class-exams";

export const metadata: Metadata = { title: "Шалгалтын дүн", robots: { index: false, follow: false } };

export default async function ClassExamResultPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const data = await getStudentClassExamResult(examId);
  const submission = data.submission!;
  const percentage = submission.maxScore ? Math.round(submission.totalScore / submission.maxScore * 100) : 0;
  return <PortalShell active="/dashboard/exams"><Link href="/dashboard/exams" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Шалгалтууд</Link><div className="mt-6"><PortalHeader title="Шалгалтын дүн" description={`${data.exam.title} · ${data.exam.classroomName}`}/></div>
    <section className="mt-7 rounded-2xl border bg-white p-6 sm:p-8"><div className="flex flex-col items-center text-center"><span className={`grid h-16 w-16 place-items-center rounded-2xl ${submission.needsManualGrading ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{submission.needsManualGrading ? <Hourglass size={29}/> : <CheckCircle2 size={29}/>}</span><h2 className="mt-5 text-xl font-semibold">{submission.needsManualGrading ? "Багш шалгаж байна" : "Дүн гарлаа"}</h2><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{submission.needsManualGrading ? "Сонголттой болон тоон хариултын оноо гарсан. Задгай хариултыг багш шалгасны дараа эцсийн дүн шинэчлэгдэнэ." : "Таны шалгалтын бүх хариултыг үнэлж дууслаа."}</p><div className="mt-7 grid w-full max-w-xl grid-cols-3 gap-3"><Stat label="Нийт оноо" value={`${formatScore(submission.totalScore)} / ${formatScore(submission.maxScore)}`}/><Stat label="Хувь" value={`${percentage}%`}/><Stat label="Хугацаа" value={`${data.exam.durationMinutes} мин`}/></div>{submission.teacherFeedback && <div className="mt-6 w-full max-w-xl rounded-xl bg-primary/5 p-4 text-left"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Багшийн тайлбар</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{submission.teacherFeedback}</p></div>}<Link href="/dashboard/exams" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white"><Clock3 size={16}/>Бусад шалгалт</Link></div></section>
  </PortalShell>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted p-4"><p className="text-lg font-bold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>; }
