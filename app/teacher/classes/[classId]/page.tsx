import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardList, Clock3, Copy, Plus, Users } from "lucide-react";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { StudentProgressTable } from "@/components/teacher/student-progress-table";
import { TeacherVerificationState } from "@/components/teacher/teacher-verification-state";
import { getTeacherOverview } from "@/lib/data/classrooms";
import { getTeacherClassExams } from "@/lib/data/class-exams";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Ангийн явц", robots: { index: false, follow: false } };

const statusLabels = { draft: "Ноорог", scheduled: "Товлосон", active: "Идэвхтэй", closed: "Хаагдсан" } as const;

export default async function TeacherClassPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ classId }, query] = await Promise.all([params, searchParams]);
  const data = await getTeacherOverview(classId);
  if (data.verificationStatus !== "approved") return <TeacherShell name={data.teacherName} schoolName={data.schoolName}><TeacherVerificationState status={data.verificationStatus} schoolName={data.schoolName}/></TeacherShell>;
  if (!data.selected) return <TeacherShell name={data.teacherName} schoolName={data.schoolName}><EmptyState heading="h1" pose="oops" title="Анги олдсонгүй" action={<Link href="/teacher" className="btn-outline">Самбар руу буцах</Link>}/></TeacherShell>;
  const exams = await getTeacherClassExams(classId);
  const students = data.students.filter((student) => student.classIds.includes(classId));
  return (
    <TeacherShell name={data.teacherName} schoolName={data.schoolName}>
      <Link href="/teacher" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Бүх анги</Link>
      {query.created && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={16}/>Анги үүслээ. Кодыг сурагчдадаа өгөөрэй.</p>}
      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold tracking-[.15em] text-[#2B4BE8]">АНГИЙН ЯВЦ</p><h1 className="mt-2 text-[26px] font-medium tracking-[-0.03em] sm:text-[30px]">{data.selected.name}</h1><p className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground"><Users size={16}/>{students.length} сурагч</p></div><div className="rounded-[16px] border-2 border-[#EEF0F6] bg-white px-5 py-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ангийн код</p><p className="mt-1 inline-flex items-center gap-2 font-mono text-lg font-bold tracking-[.2em] text-primary"><Copy size={16}/>{data.selected.code}</p></div></div>
      <section className="mt-8 rounded-[22px] border-2 border-[#EEF0F6] bg-white">
        <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold">Ангийн шалгалтууд</h2><p className="mt-1 text-xs text-muted-foreground">Сангаас сонгоод эхлүүлэх эсвэл товлох.</p></div><Link href={`/teacher/classes/${classId}/exams/new`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#0B1030] px-4 text-sm font-semibold text-white"><Plus size={16}/>Шалгалт эхлүүлэх</Link></div>
        {exams.length ? <div className="divide-y">{exams.map((exam) => <Link key={exam.id} href={`/teacher/exams/${exam.id}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-muted/40 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E8EEFF] text-[#2B4BE8]"><ClipboardList size={18}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{exam.title}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${exam.status === "active" ? "bg-emerald-50 text-emerald-700" : exam.status === "scheduled" ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"}`}>{statusLabels[exam.status]}</span></div><p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>{exam.questionCount} асуулт</span><span className="inline-flex items-center gap-1"><Clock3 size={13}/>{exam.durationMinutes} минут</span>{exam.startsAt && <span>{formatDate(exam.startsAt)}</span>}</p></div><span className="text-xs font-semibold text-primary">Удирдах →</span></Link>)}</div> : <div className="px-6 py-10 text-center text-sm text-muted-foreground">Шалгалт үүсгээгүй байна.</div>}
      </section>
      <div className="mt-8"><StudentProgressTable students={students} classroomId={classId}/></div>
    </TeacherShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("mn-MN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" }).format(new Date(value));
}
