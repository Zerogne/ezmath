import Link from "next/link";
import { AlertTriangle, BookOpenCheck, Building2, Check, ClipboardCheck, Clock3, GraduationCap, Users, X } from "lucide-react";
import { SchoolShell } from "@/components/school/school-shell";
import { TeacherCodeCard } from "@/components/school/teacher-code-card";
import { getSchoolDashboard } from "@/lib/data/school-dashboard";
import { reviewTeacher } from "./actions";

const teacherStatus = {
  pending: { label: "Хүлээгдэж буй", classes: "bg-amber-100 text-amber-800" },
  approved: { label: "Баталгаажсан", classes: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Татгалзсан", classes: "bg-red-100 text-red-800" },
} as const;

export default async function SchoolPage({ searchParams }: { searchParams: Promise<{ error?: string; teacherUpdated?: string }> }) {
  const [data, query] = await Promise.all([getSchoolDashboard(), searchParams]);

  return (
    <SchoolShell name={data.accountName} schoolName={data.schoolName}>
      <header>
        <p className="text-xs font-semibold tracking-[.15em] text-primary">СУРГУУЛИЙН ХЭСЭГ</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">{data.schoolName}</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Багш, анги, сурагчдын сургалтын үйл ажиллагааны нэгдсэн хяналт.</p>
      </header>

      {data.mustChangePassword && <div role="alert" className="mt-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center"><AlertTriangle size={18} className="shrink-0"/><p className="flex-1">Та түр нууц үгээр нэвтэрсэн байна. Өөрийн нууц үгээ тохируулна уу.</p><Link href="/school/settings#password" className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-amber-900 px-4 text-xs font-semibold text-white hover:bg-amber-950">Нууц үг солих</Link></div>}
      {query.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">Багшийн хүсэлтийг шинэчилж чадсангүй. Дахин оролдоно уу.</p>}
      {query.teacherUpdated && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Багшийн эрхийн төлөв амжилттай шинэчлэгдлээ.</p>}

      <TeacherCodeCard code={data.teacherCode}/>

      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Metric icon={GraduationCap} label="Идэвхтэй багш" value={data.teacherCount}/>
        <Metric icon={Clock3} label="Хүлээгдэж буй" value={data.pendingTeacherCount}/>
        <Metric icon={Users} label="Сурагч" value={data.studentCount}/>
        <Metric icon={Building2} label="Анги" value={data.classCount}/>
        <Metric icon={ClipboardCheck} label="Дууссан mock" value={data.completedAttempts}/>
        <Metric icon={BookOpenCheck} label="Дууссан хичээл" value={data.completedLessons}/>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Баталгаажуулалт хүлээж буй багш</h2>
            <p className="mt-1 text-xs text-muted-foreground">Зөвхөн танай сургуулийн кодоор бүртгүүлсэн хүсэлтүүд.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{data.pendingTeacherCount}</span>
        </div>
        {data.pendingTeachers.length ? (
          <div className="divide-y">
            {data.pendingTeachers.map((teacher) => (
              <div key={teacher.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{teacher.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Хүсэлт: {new Intl.DateTimeFormat("mn-MN", { dateStyle: "medium" }).format(new Date(teacher.createdAt))}</p>
                </div>
                <div className="flex gap-2">
                  <form action={reviewTeacher}>
                    <input type="hidden" name="teacherId" value={teacher.id}/>
                    <input type="hidden" name="status" value="approved"/>
                    <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white"><Check size={16} aria-hidden="true"/>Зөвшөөрөх</button>
                  </form>
                  <form action={reviewTeacher}>
                    <input type="hidden" name="teacherId" value={teacher.id}/>
                    <input type="hidden" name="status" value="rejected"/>
                    <button className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold text-red-700 hover:bg-red-50"><X size={16} aria-hidden="true"/>Татгалзах</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty text="Хүлээгдэж буй багшийн хүсэлт алга."/>}
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b px-5 py-4"><h2 className="font-semibold">Ангиуд</h2></div>
          {data.classes.length ? <div className="divide-y">{data.classes.map((item)=><div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.teacherName} · {item.code}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{item.studentCount} сурагч</span></div>)}</div> : <Empty text="Анги үүсээгүй байна."/>}
        </section>
        <section className="overflow-hidden rounded-2xl border bg-white">
          <div className="border-b px-5 py-4"><h2 className="font-semibold">Багш нар</h2></div>
          {data.teachers.length ? <div className="divide-y">{data.teachers.map((teacher) => { const status = teacherStatus[teacher.status]; return <div key={teacher.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-semibold">{teacher.name}</p><p className="mt-1 text-xs text-muted-foreground">{teacher.classes} анги · {teacher.students} сурагч</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>{status.label}</span></div>; })}</div> : <Empty text="Багш бүртгүүлээгүй байна."/>}
        </section>
      </div>
    </SchoolShell>
  );
}

function Metric({icon:Icon,label,value}:{icon:typeof Users;label:string;value:number}) { return <article className="rounded-2xl border bg-white p-5"><Icon size={19} className="text-primary"/><p className="mt-4 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></article>; }
function Empty({text}:{text:string}) { return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{text}</p>; }
