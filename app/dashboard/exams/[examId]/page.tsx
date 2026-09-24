import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, FileQuestion } from "lucide-react";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { StartClassExamButton } from "@/components/exam/start-class-exam-button";
import { getStudentClassExam } from "@/lib/data/class-exams";

export const metadata: Metadata = { title: "Ангийн шалгалт", robots: { index: false, follow: false } };

export default async function StudentClassExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const data = await getStudentClassExam(examId);
  const { exam, submission } = data;
  return <PortalShell active="/dashboard/exams"><Link href="/dashboard/exams" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Шалгалтууд</Link><div className="mt-6"><PortalHeader title={exam.title} description={exam.classroomName}/></div>
    <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"><section className="rounded-2xl border bg-white p-6 sm:p-8"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><FileQuestion size={25}/></span><h2 className="mt-5 text-xl font-semibold">Шалгалтын мэдээлэл</h2>{exam.instructions ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{exam.instructions}</p> : <p className="mt-3 text-sm text-muted-foreground">Асуулт бүрийг анхааралтай уншиж хариулаарай.</p>}<div className="mt-6 flex flex-wrap gap-3"><Info icon={<Clock3 size={15}/>} value={`${exam.durationMinutes} минут`}/>{exam.startsAt && <Info icon={<CalendarClock size={15}/>} value={`Эхлэх: ${formatDate(exam.startsAt)}`}/>} {exam.closesAt && <Info icon={<CalendarClock size={15}/>} value={`Хаагдах: ${formatDate(exam.closesAt)}`}/>}</div><div className="mt-7 border-t pt-6">{submission && submission.status !== "in_progress" ? <div><p className="inline-flex items-center gap-2 font-semibold text-emerald-700"><CheckCircle2 size={18}/>Шалгалтаа илгээсэн</p><div className="mt-4"><Link href={`/dashboard/exams/${exam.id}/result`} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">Дүн харах</Link></div></div> : exam.canTake ? <StartClassExamButton examId={exam.id} label={submission ? "Шалгалт үргэлжлүүлэх" : "Шалгалт эхлэх"}/> : <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">{exam.status === "scheduled" ? `Шалгалт ${exam.startsAt ? formatDate(exam.startsAt) : "товлосон цагт"} нээгдэнэ.` : "Энэ шалгалт одоогоор нээлттэй биш байна."}</p>}</div></section><aside className="rounded-2xl border bg-[#0b1030] p-5 text-white"><p className="text-sm font-semibold">Санамж</p><ul className="mt-4 space-y-3 text-xs leading-5 text-slate-300"><li>• Эхэлсний дараа хугацаа тасралтгүй явна.</li><li>• Тоон хариунд таслал эсвэл цэг ашиглаж болно.</li><li>• Задгай хариуг багш гараар шалгана.</li><li>• Илгээсний дараа хариултаа өөрчлөх боломжгүй.</li></ul></aside></div>
  </PortalShell>;
}

function Info({ icon, value }: { icon: React.ReactNode; value: string }) { return <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{icon}{value}</span>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" }).format(new Date(value)); }
