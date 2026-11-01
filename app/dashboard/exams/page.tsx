import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { ArtTile, btnSmDark, Chip, portalCard, portalMuted, SectionTitle } from "@/components/dashboard/portal-ui";
import { TestGrid } from "@/components/dashboard/portal-views";
import { formatScore } from "@/lib/class-exams/format";
import { getStudentClassExams } from "@/lib/data/class-exams";
import { getPortalData } from "@/lib/data/student-portal";

export const metadata: Metadata = { title: "Сорил & шалгалт" };

const statusLabels = { draft: "Ноорог", scheduled: "Товлосон", active: "Нээлттэй", closed: "Хаагдсан" } as const;
const statusTone = { draft: "grey", scheduled: "blue", active: "green", closed: "grey" } as const;

export default async function Page() {
  const [data, classExams] = await Promise.all([getPortalData(), getStudentClassExams()]);
  return <PortalShell active="/dashboard/exams" plan={data.plan}>
    <PortalHeader title="Сорил & шалгалт" description="Багшийн өгсөн шалгалт, бүтэн mock болон өмнөх оны ЭЕШ-ийн материал."/>
    {classExams.length > 0 && <section className="mt-7">
      <SectionTitle title="Ангийн шалгалтууд" text="Таны нэгдсэн ангиудад багшийн өгсөн шалгалтууд."/>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{classExams.map((exam) => <article key={exam.id} className={`${portalCard} flex flex-col p-5`}>
        <div className="flex items-start justify-between gap-3"><ArtTile kind="gradcap" bg="#EFE6FF" size={56} art={48}/><Chip tone={statusTone[exam.status]}>{statusLabels[exam.status]}</Chip></div>
        <h3 className="mt-4 font-sans text-[17px] font-semibold tracking-normal">{exam.title}</h3>
        <p className={`mt-1 text-sm ${portalMuted}`}>{exam.classroomName}</p>
        <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium ${portalMuted}`}><span className="inline-flex items-center gap-1"><ListChecks size={14}/>{exam.questionCount} асуулт</span><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{exam.durationMinutes} минут</span>{exam.startsAt && <span className="inline-flex items-center gap-1"><CalendarClock size={14}/>{formatDate(exam.startsAt)}</span>}</div>
        <div className="mt-auto pt-5">{exam.submission?.status === "graded"
          ? <div className="flex items-center justify-between rounded-2xl bg-[#E9FBF2] px-4 py-3"><p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#15803D]"><CheckCircle2 size={16}/>{formatScore(exam.submission.totalScore)} / {formatScore(exam.submission.maxScore)} оноо</p><Link href={`/dashboard/exams/${exam.id}/result`} className="text-sm font-semibold text-[#2B4BE8]">Дүн харах →</Link></div>
          : exam.submission?.status === "submitted"
            ? <div className="flex items-center justify-between rounded-2xl bg-[#FEF3C7] px-4 py-3"><p className="text-sm font-semibold text-[#B45309]">Багш шалгаж байна</p><Link href={`/dashboard/exams/${exam.id}/result`} className="text-sm font-semibold text-[#2B4BE8]">Харах →</Link></div>
            : <Link href={`/dashboard/exams/${exam.id}`} className={`${btnSmDark} w-full`}>{exam.submission?.status === "in_progress" ? "Үргэлжлүүлэх" : exam.status === "active" ? "Шалгалт өгөх" : "Дэлгэрэнгүй"}<ArrowRight size={15}/></Link>}</div>
      </article>)}</div>
    </section>}
    <section className="mt-8"><SectionTitle title="EzMath сорилууд" text="Бүтэн mock болон өмнөх оны ЭЕШ-ийн материал."/><TestGrid tests={data.tests.filter((item) => item.type !== "practice")} attempts={data.attempts} action="Сорил эхлэх" paid={data.plan.code !== "free"}/></section>
  </PortalShell>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("mn-MN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" }).format(new Date(value)); }
