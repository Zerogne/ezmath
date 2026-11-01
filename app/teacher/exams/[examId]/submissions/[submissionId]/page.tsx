import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { gradeClassExamSubmission } from "@/app/class-exam-actions";
import { MathText } from "@/components/math/math-text";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import { formatScore } from "@/lib/class-exams/format";
import { getClassExamSubmissionReview } from "@/lib/data/class-exams";

export const metadata: Metadata = { title: "Шалгалт дүгнэх", robots: { index: false, follow: false } };

export default async function SubmissionReviewPage({ params }: { params: Promise<{ examId: string; submissionId: string }> }) {
  const { examId, submissionId } = await params;
  const data = await getClassExamSubmissionReview(examId, submissionId);
  return (
    <TeacherShell name={data.teacherName} schoolName={data.schoolName}>
      <Link href={`/teacher/exams/${examId}`} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/>Шалгалт руу буцах</Link>
      <header className="mt-6"><p className="text-xs font-semibold tracking-[.15em] text-primary">ГАРААР ДҮГНЭХ</p><h1 className="mt-2 text-2xl font-semibold sm:text-[28px]">{data.submission.studentName}</h1><p className="mt-1 text-sm text-muted-foreground">{data.exam.title} · Автомат оноо {formatScore(data.submission.autoScore)} / {formatScore(data.submission.maxScore)}</p></header>
      <form action={gradeClassExamSubmission} className="mt-7 space-y-4">
        <input type="hidden" name="examId" value={examId}/><input type="hidden" name="submissionId" value={submissionId}/>
        {data.reviewItems.map(({ question, answer }) => <article key={question.id} className="rounded-2xl border bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-primary">Асуулт {question.position} · {question.topic}</p><h2 className="mt-1 font-semibold">{question.title}</h2></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{formatScore(question.maxPoints)} оноо</span></div><div className="mt-4 overflow-x-auto rounded-xl bg-slate-50 p-4 text-sm leading-7"><MathText>{question.questionLatex}</MathText></div>
          {question.answerType === "multiple_choice" && <div className="mt-4 grid gap-3 sm:grid-cols-2"><AnswerBox label="Сурагчийн хариу" value={answer?.selected_choice || "Хариулаагүй"}/><AnswerBox label="Зөв хариу" value={question.answerKey || "—"} correct/></div>}
          {question.answerType === "numeric" && <div className="mt-4 grid gap-3 sm:grid-cols-2"><AnswerBox label="Сурагчийн хариу" value={answer?.response_text || "Хариулаагүй"}/><AnswerBox label="Зөв хариу" value={question.answerKey || "—"} correct/></div>}
          {question.answerType === "free_response" && <div className="mt-4 grid gap-4 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Сурагчийн хариу</p><div className="mt-2 min-h-28 whitespace-pre-wrap rounded-xl border bg-white p-4 text-sm leading-6">{answer?.response_text || "Хариулаагүй"}</div><p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rubric / жишиг хариу</p><div className="mt-2 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><MathText>{question.answerKey || "—"}</MathText></div></div><div className="grid content-start gap-4"><label className="grid gap-1.5 text-sm font-medium">Өгөх оноо<input type="number" name={`score:${answer?.id}`} min={0} max={question.maxPoints} step="0.25" required defaultValue={answer?.manual_score ?? 0} disabled={!answer} className="h-11 rounded-xl border px-3"/></label><label className="grid gap-1.5 text-sm font-medium">Асуултын тайлбар<textarea name={`feedback:${answer?.id}`} defaultValue={answer?.teacher_feedback ?? ""} disabled={!answer} rows={4} className="rounded-xl border p-3" placeholder="Сурагчид өгөх тайлбар"/></label></div></div>}
          {question.answerType !== "free_response" && <p className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${answer?.is_correct ? "text-emerald-700" : "text-red-700"}`}><CheckCircle2 size={15}/>{answer?.is_correct ? `${formatScore(answer.auto_score)} оноо` : "0 оноо"}</p>}
        </article>)}
        <section className="rounded-2xl border bg-white p-5 sm:p-6"><label className="grid gap-1.5 text-sm font-medium">Ерөнхий тайлбар<textarea name="teacherFeedback" defaultValue={data.submission.teacherFeedback} rows={4} className="rounded-xl border p-3" placeholder="Сурагчийн нийт гүйцэтгэлийн тухай..."/></label><div className="mt-5 flex justify-end"><button className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white"><CheckCircle2 size={16}/>Дүн хадгалах</button></div></section>
      </form>
    </TeacherShell>
  );
}

function AnswerBox({ label, value, correct = false }: { label: string; value: string; correct?: boolean }) { return <div className={`rounded-xl border p-4 ${correct ? "border-emerald-200 bg-emerald-50" : "bg-white"}`}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-2 text-sm"><MathText>{value}</MathText></div></div>; }
