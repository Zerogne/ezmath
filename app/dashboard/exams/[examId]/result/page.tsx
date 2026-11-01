import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { btnSmDark, portalCard, portalMuted } from "@/components/dashboard/portal-ui";
import { Ezi } from "@/components/home/redesign/illustrations";
import { formatScore } from "@/lib/class-exams/format";
import { getStudentClassExamResult } from "@/lib/data/class-exams";

export const metadata: Metadata = { title: "Шалгалтын дүн", robots: { index: false, follow: false } };

export default async function ClassExamResultPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const data = await getStudentClassExamResult(examId);
  const submission = data.submission!;
  const percentage = submission.maxScore ? Math.round(submission.totalScore / submission.maxScore * 100) : 0;
  const pending = submission.needsManualGrading;
  return <PortalShell active="/dashboard/exams">
    <PortalHeader back={{ href: "/dashboard/exams", label: "Шалгалтууд" }} title="Шалгалтын дүн" description={`${data.exam.title} · ${data.exam.classroomName}`}/>
    <section className={`${portalCard} mt-6 flex flex-col items-center px-6 py-10 text-center sm:px-10`}>
      <Ezi pose={pending ? "think" : percentage >= 70 ? "celebrate" : "happy"} size={140}/>
      <h2 className="mt-3 text-[26px] font-medium tracking-[-0.03em]">{pending ? "Багш шалгаж байна" : "Дүн гарлаа"}</h2>
      <p className={`mt-2 max-w-lg text-[15px] leading-relaxed ${portalMuted}`}>{pending ? "Сонголттой болон тоон хариултын оноо гарсан. Задгай хариултыг багш шалгасны дараа эцсийн дүн шинэчлэгдэнэ." : "Таны шалгалтын бүх хариултыг үнэлж дууслаа."}</p>
      <div className="mt-7 grid w-full max-w-xl grid-cols-3 gap-3">
        <Stat label="Нийт оноо" value={`${formatScore(submission.totalScore)} / ${formatScore(submission.maxScore)}`} bg="#E8EEFF"/>
        <Stat label="Хувь" value={`${percentage}%`} bg="#E9FBF2"/>
        <Stat label="Хугацаа" value={`${data.exam.durationMinutes} мин`} bg="#FFF0E6"/>
      </div>
      {submission.teacherFeedback && <div className="mt-6 w-full max-w-xl rounded-2xl border-2 border-[#EDE6FF] bg-[#FBF9FF] p-5 text-left"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C4DEB]">Багшийн тайлбар</p><p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{submission.teacherFeedback}</p></div>}
      <Link href="/dashboard/exams" className={`${btnSmDark} mt-7`}>Бусад шалгалт<ArrowRight size={15}/></Link>
    </section>
  </PortalShell>;
}

function Stat({ label, value, bg }: { label: string; value: string; bg: string }) { return <div className="rounded-2xl p-4" style={{ background: bg }}><p className="font-display text-xl font-medium tracking-[-0.02em] sm:text-2xl">{value}</p><p className="mt-1 text-xs font-medium text-[#5B6275]">{label}</p></div>; }
