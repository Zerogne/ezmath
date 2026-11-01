import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { ArtTile, btnSmDark, Chip, portalCard, portalMuted } from "@/components/dashboard/portal-ui";
import { StartClassExamButton } from "@/components/exam/start-class-exam-button";
import { Ezi } from "@/components/home/redesign/illustrations";
import { getStudentClassExam } from "@/lib/data/class-exams";

export const metadata: Metadata = { title: "Ангийн шалгалт", robots: { index: false, follow: false } };

const tips = ["Эхэлсний дараа хугацаа тасралтгүй явна.", "Тоон хариунд таслал эсвэл цэг ашиглаж болно.", "Задгай хариуг багш гараар шалгана.", "Илгээсний дараа хариултаа өөрчлөх боломжгүй."];

export default async function StudentClassExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const { exam, submission } = await getStudentClassExam(examId);
  return <PortalShell active="/dashboard/exams">
    <PortalHeader back={{ href: "/dashboard/exams", label: "Шалгалтууд" }} title={exam.title} description={exam.classroomName}/>
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className={`${portalCard} p-6 sm:p-8`}>
        <div className="flex items-center gap-4"><ArtTile kind="gradcap" bg="#EFE6FF" size={72} art={60}/><div><h2 className="font-sans text-xl font-semibold tracking-normal">Шалгалтын мэдээлэл</h2><p className={`mt-1 text-sm ${portalMuted}`}>Ангийн шалгалт · багш шалгана</p></div></div>
        <p className={`mt-5 whitespace-pre-wrap text-[15px] leading-7 ${portalMuted}`}>{exam.instructions || "Асуулт бүрийг анхааралтай уншиж хариулаарай."}</p>
        <div className="mt-5 flex flex-wrap gap-2"><Chip icon={<Clock3 size={13}/>}>{exam.durationMinutes} минут</Chip>{exam.startsAt && <Chip icon={<CalendarClock size={13}/>}>Эхлэх: {formatDate(exam.startsAt)}</Chip>}{exam.closesAt && <Chip icon={<CalendarClock size={13}/>}>Хаагдах: {formatDate(exam.closesAt)}</Chip>}</div>
        <div className="mt-7 border-t-2 border-[#F4F5FA] pt-6">{submission && submission.status !== "in_progress"
          ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#E9FBF2] px-5 py-4"><p className="inline-flex items-center gap-2 font-semibold text-[#15803D]"><CheckCircle2 size={18}/>Шалгалтаа илгээсэн</p><Link href={`/dashboard/exams/${exam.id}/result`} className={btnSmDark}>Дүн харах</Link></div>
          : exam.canTake ? <StartClassExamButton examId={exam.id} label={submission ? "Шалгалт үргэлжлүүлэх" : "Шалгалт эхлэх"}/>
            : <p className={`rounded-2xl bg-[#F6F7FB] px-5 py-4 text-sm ${portalMuted}`}>{exam.status === "scheduled" ? `Шалгалт ${exam.startsAt ? formatDate(exam.startsAt) : "товлосон цагт"} нээгдэнэ.` : "Энэ шалгалт одоогоор нээлттэй биш байна."}</p>}</div>
      </section>
      <aside className="relative h-fit overflow-hidden rounded-[22px] bg-[#0B1030] p-6 text-white">
        <p className="font-semibold">Санамж</p>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[#AEB4CC]">{tips.map((tip) => <li key={tip} className="flex gap-2.5"><CheckCircle2 size={16} className="mt-1 shrink-0 text-[#6EE7B7]"/>{tip}</li>)}</ul>
        <Ezi pose="think" size={96} className="ml-auto mt-2 block"/>
      </aside>
    </div>
  </PortalShell>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" }).format(new Date(value)); }
