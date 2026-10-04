import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClassExamBuilder } from "@/components/teacher/class-exam-builder";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { getClassExamBuilder } from "@/lib/data/class-exams";

export const metadata: Metadata = { title: "Шалгалт үүсгэх", robots: { index: false, follow: false } };

export default async function NewClassExamPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const data = await getClassExamBuilder(classId);
  return (
    <TeacherShell name={data.teacherName} schoolName={data.schoolName}>
      <Link href={`/teacher/classes/${classId}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Анги руу буцах</Link>
      <header className="mt-6"><p className="text-xs font-semibold tracking-[.15em] text-primary">АНГИЙН ШАЛГАЛТ</p><h1 className="mt-2 text-2xl font-semibold tracking-[-.02em] sm:text-[28px]">{data.classroom.name}-д шалгалт үүсгэх</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">Сангаас материал, бодлого сонгох эсвэл шинэ асуулт бичнэ үү.</p></header>
      <ClassExamBuilder classroom={data.classroom} materials={data.materials} collections={data.collections}/>
    </TeacherShell>
  );
}
