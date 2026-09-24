import "server-only";

import { notFound, redirect } from "next/navigation";
import { parseChoices } from "@/lib/class-exams/choices";
import { requireApprovedTeacher, requireStudent } from "@/lib/data/classrooms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ClassExamStatus, ClassExamSubmissionStatus, Json, SchoolLibraryAnswerType } from "@/lib/supabase/database.types";
import type { ClassExamChoice } from "@/lib/class-exams/types";

export type ClassExamQuestion = {
  id: string;
  examId: string;
  sourceMaterialId: string | null;
  position: number;
  title: string;
  topic: string;
  questionLatex: string;
  answerType: SchoolLibraryAnswerType;
  answerKey?: string;
  choices: ClassExamChoice[];
  maxPoints: number;
};

export type ClassExamSummary = {
  id: string;
  classroomId: string;
  classroomName: string;
  title: string;
  instructions: string;
  durationMinutes: number;
  startsAt: string | null;
  closesAt: string | null;
  status: ClassExamStatus;
  questionCount: number;
  submission?: {
    id: string;
    status: ClassExamSubmissionStatus;
    totalScore: number;
    maxScore: number;
    needsManualGrading: boolean;
  };
};

export async function getClassExamBuilder(classroomId: string) {
  const { user, profile } = await requireApprovedTeacher(`/teacher/classes/${classroomId}/exams/new`);
  if (!profile.school_id) redirect("/teacher");
  const admin = createAdminClient();
  const [{ data: classroom }, { data: school }, { data: materials, error }] = await Promise.all([
    admin.from("classrooms").select("id, name, school_id, teacher_id").eq("id", classroomId).eq("teacher_id", user.id).eq("school_id", profile.school_id).maybeSingle(),
    admin.from("schools").select("name").eq("id", profile.school_id).maybeSingle(),
    admin.from("school_library_materials").select("id, title, topic, question_latex, answer_type, answer_key, choices").eq("school_id", profile.school_id).order("updated_at", { ascending: false }),
  ]);
  if (!classroom) notFound();
  if (error) throw new Error("Бодлогын санг ачаалж чадсангүй.");
  return {
    teacherName: profile.full_name || "Багш",
    schoolName: school?.name || "Сургууль",
    classroom: { id: classroom.id, name: classroom.name },
    materials: (materials ?? []).map((material) => ({
      id: material.id,
      title: material.title,
      topic: material.topic,
      questionLatex: material.question_latex,
      answerType: material.answer_type,
      answerKey: material.answer_key,
      choices: parseChoices(material.choices),
    })),
  };
}

export async function getTeacherClassExams(classroomId: string): Promise<ClassExamSummary[]> {
  const { user } = await requireApprovedTeacher(`/teacher/classes/${classroomId}`);
  const admin = createAdminClient();
  const { data: classroom } = await admin.from("classrooms").select("id, name").eq("id", classroomId).eq("teacher_id", user.id).maybeSingle();
  if (!classroom) return [];
  const { data: exams } = await admin.from("class_exams").select("id, classroom_id, title, instructions, duration_minutes, starts_at, closes_at, status").eq("classroom_id", classroom.id).eq("teacher_id", user.id).order("created_at", { ascending: false });
  return addQuestionCounts(admin, exams ?? [], new Map([[classroom.id, classroom.name]]));
}

export async function getTeacherClassExam(examId: string) {
  const { user, profile } = await requireApprovedTeacher(`/teacher/exams/${examId}`);
  const admin = createAdminClient();
  const { data: exam } = await admin
    .from("class_exams")
    .select("id, classroom_id, school_id, teacher_id, title, instructions, duration_minutes, starts_at, closes_at, status, created_at")
    .eq("id", examId)
    .eq("teacher_id", user.id)
    .maybeSingle();
  if (!exam) notFound();
  const [{ data: classroom }, { data: school }, { data: questions }, { data: submissions }] = await Promise.all([
    admin.from("classrooms").select("id, name").eq("id", exam.classroom_id).single(),
    admin.from("schools").select("name").eq("id", exam.school_id).maybeSingle(),
    admin.from("class_exam_questions").select("id, exam_id, source_material_id, position, title, topic, question_latex, answer_type, answer_key, choices, max_points").eq("exam_id", exam.id).order("position"),
    admin.from("class_exam_submissions").select("id, student_id, status, started_at, submitted_at, graded_at, auto_score, manual_score, total_score, max_score, needs_manual_grading, teacher_feedback").eq("exam_id", exam.id).order("submitted_at", { ascending: false }),
  ]);
  const studentIds = [...new Set((submissions ?? []).map((submission) => submission.student_id))];
  const { data: students } = studentIds.length ? await admin.from("profiles").select("id, full_name").in("id", studentIds) : { data: [] };
  const studentNames = new Map((students ?? []).map((student) => [student.id, student.full_name || "Нэргүй сурагч"]));
  return {
    teacherName: profile.full_name || "Багш",
    schoolName: school?.name || "Сургууль",
    exam: {
      id: exam.id,
      classroomId: exam.classroom_id,
      classroomName: classroom?.name || "Анги",
      title: exam.title,
      instructions: exam.instructions,
      durationMinutes: exam.duration_minutes,
      startsAt: exam.starts_at,
      closesAt: exam.closes_at,
      status: effectiveStatus(exam.status, exam.starts_at, exam.closes_at),
      questions: (questions ?? []).map((question) => mapQuestion(question, true)),
    },
    submissions: (submissions ?? []).map((submission) => ({
      id: submission.id,
      studentId: submission.student_id,
      studentName: studentNames.get(submission.student_id) || "Нэргүй сурагч",
      status: submission.status as ClassExamSubmissionStatus,
      startedAt: submission.started_at,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      autoScore: Number(submission.auto_score),
      manualScore: Number(submission.manual_score),
      totalScore: Number(submission.total_score),
      maxScore: Number(submission.max_score),
      needsManualGrading: submission.needs_manual_grading,
      teacherFeedback: submission.teacher_feedback,
    })),
  };
}

export async function getStudentClassExams(): Promise<ClassExamSummary[]> {
  const { user } = await requireStudent("/dashboard/exams");
  const admin = createAdminClient();
  const { data: memberships } = await admin.from("classroom_students").select("classroom_id").eq("student_id", user.id);
  const classroomIds = (memberships ?? []).map((membership) => membership.classroom_id);
  if (!classroomIds.length) return [];
  const [{ data: classrooms }, { data: exams }] = await Promise.all([
    admin.from("classrooms").select("id, name").in("id", classroomIds),
    admin.from("class_exams").select("id, classroom_id, title, instructions, duration_minutes, starts_at, closes_at, status").in("classroom_id", classroomIds).neq("status", "draft").order("starts_at", { ascending: false }),
  ]);
  const summaries = await addQuestionCounts(admin, exams ?? [], new Map((classrooms ?? []).map((classroom) => [classroom.id, classroom.name])));
  const examIds = summaries.map((exam) => exam.id);
  const { data: submissions } = examIds.length
    ? await admin.from("class_exam_submissions").select("id, exam_id, status, total_score, max_score, needs_manual_grading").eq("student_id", user.id).in("exam_id", examIds)
    : { data: [] };
  const submissionMap = new Map((submissions ?? []).map((submission) => [submission.exam_id, {
    id: submission.id,
    status: submission.status as ClassExamSubmissionStatus,
    totalScore: Number(submission.total_score),
    maxScore: Number(submission.max_score),
    needsManualGrading: submission.needs_manual_grading,
  }]));
  return summaries.map((exam) => ({ ...exam, submission: submissionMap.get(exam.id) }));
}

export async function getStudentClassExam(examId: string, includeQuestions = false) {
  const { user } = await requireStudent(`/dashboard/exams/${examId}`);
  const admin = createAdminClient();
  const { data: exam } = await admin.from("class_exams").select("id, classroom_id, title, instructions, duration_minutes, starts_at, closes_at, status").eq("id", examId).maybeSingle();
  if (!exam) notFound();
  const { data: membership } = await admin.from("classroom_students").select("classroom_id").eq("classroom_id", exam.classroom_id).eq("student_id", user.id).maybeSingle();
  if (!membership || exam.status === "draft") notFound();
  const [classroomResult, submissionResult, questionsResult] = await Promise.all([
    admin.from("classrooms").select("name").eq("id", exam.classroom_id).single(),
    admin.from("class_exam_submissions").select("id, status, started_at, submitted_at, graded_at, auto_score, manual_score, total_score, max_score, needs_manual_grading, teacher_feedback").eq("exam_id", exam.id).eq("student_id", user.id).maybeSingle(),
    includeQuestions ? admin.from("class_exam_questions").select("id, exam_id, source_material_id, position, title, topic, question_latex, answer_type, choices, max_points").eq("exam_id", exam.id).order("position") : Promise.resolve({ data: [] }),
  ]);
  const classroom = classroomResult.data;
  let submission = submissionResult.data;
  const questions = questionsResult.data;
  const status = effectiveStatus(exam.status, exam.starts_at, exam.closes_at);
  if (submission?.status === "in_progress" && submissionExpired(exam, submission.started_at, status)) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_class_exam", { p_exam_id: exam.id, p_answers: [] });
    if (error) throw new Error("Хугацаа дууссан шалгалтыг хааж чадсангүй.");
    const finalized = await admin.from("class_exam_submissions").select("id, status, started_at, submitted_at, graded_at, auto_score, manual_score, total_score, max_score, needs_manual_grading, teacher_feedback").eq("exam_id", exam.id).eq("student_id", user.id).single();
    submission = finalized.data;
  }
  const canTake = Boolean(exam.starts_at && new Date(exam.starts_at) <= new Date() && status === "active" && (!submission || submission.status === "in_progress"));
  return {
    exam: {
      id: exam.id,
      classroomName: classroom?.name || "Анги",
      title: exam.title,
      instructions: exam.instructions,
      durationMinutes: exam.duration_minutes,
      startsAt: exam.starts_at,
      closesAt: exam.closes_at,
      status,
      canTake,
      questions: (questions ?? []).map((question) => mapQuestion(question, false)),
    },
    submission: submission ? {
      id: submission.id,
      status: submission.status as ClassExamSubmissionStatus,
      startedAt: submission.started_at,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      autoScore: Number(submission.auto_score),
      manualScore: Number(submission.manual_score),
      totalScore: Number(submission.total_score),
      maxScore: Number(submission.max_score),
      needsManualGrading: submission.needs_manual_grading,
      teacherFeedback: submission.teacher_feedback,
    } : null,
  };
}

export async function getStudentClassExamForTake(examId: string) {
  const data = await getStudentClassExam(examId, true);
  const submission = data.submission;
  if (submission && submission.status !== "in_progress") redirect(`/dashboard/exams/${examId}/result`);
  if (!data.exam.canTake || !submission) redirect(`/dashboard/exams/${examId}`);
  return { ...data, submission };
}

export async function getStudentClassExamResult(examId: string) {
  const data = await getStudentClassExam(examId, false);
  if (!data.submission || data.submission.status === "in_progress") redirect(`/dashboard/exams/${examId}`);
  return data;
}

export async function getClassExamSubmissionReview(examId: string, submissionId: string) {
  const teacherData = await getTeacherClassExam(examId);
  const submission = teacherData.submissions.find((item) => item.id === submissionId);
  if (!submission) notFound();
  const admin = createAdminClient();
  const { data: answers } = await admin.from("class_exam_answers").select("id, question_id, selected_choice, response_text, is_correct, auto_score, manual_score, teacher_feedback").eq("submission_id", submissionId);
  const answerMap = new Map((answers ?? []).map((answer) => [answer.question_id, answer]));
  return {
    ...teacherData,
    submission,
    reviewItems: teacherData.exam.questions.map((question) => ({ question, answer: answerMap.get(question.id) ?? null })),
  };
}

async function addQuestionCounts(
  admin: ReturnType<typeof createAdminClient>,
  exams: Array<{ id: string; classroom_id: string; title: string; instructions: string; duration_minutes: number; starts_at: string | null; closes_at: string | null; status: ClassExamStatus }>,
  classroomNames: Map<string, string>,
): Promise<ClassExamSummary[]> {
  const ids = exams.map((exam) => exam.id);
  const { data: questions } = ids.length ? await admin.from("class_exam_questions").select("exam_id").in("exam_id", ids) : { data: [] };
  const counts = new Map<string, number>();
  for (const question of questions ?? []) counts.set(question.exam_id, (counts.get(question.exam_id) ?? 0) + 1);
  return exams.map((exam) => ({
    id: exam.id,
    classroomId: exam.classroom_id,
    classroomName: classroomNames.get(exam.classroom_id) || "Анги",
    title: exam.title,
    instructions: exam.instructions,
    durationMinutes: exam.duration_minutes,
    startsAt: exam.starts_at,
    closesAt: exam.closes_at,
    status: effectiveStatus(exam.status, exam.starts_at, exam.closes_at),
    questionCount: counts.get(exam.id) ?? 0,
  }));
}

function mapQuestion(row: { id: string; exam_id: string; source_material_id: string | null; position: number; title: string; topic: string; question_latex: string; answer_type: SchoolLibraryAnswerType; answer_key?: string; choices: Json; max_points: number }, includeAnswer: boolean): ClassExamQuestion {
  return {
    id: row.id,
    examId: row.exam_id,
    sourceMaterialId: row.source_material_id,
    position: row.position,
    title: row.title,
    topic: row.topic,
    questionLatex: row.question_latex,
    answerType: row.answer_type,
    ...(includeAnswer ? { answerKey: row.answer_key } : {}),
    choices: parseChoices(row.choices),
    maxPoints: Number(row.max_points),
  };
}

function effectiveStatus(status: ClassExamStatus, startsAt: string | null, closesAt: string | null): ClassExamStatus {
  const now = Date.now();
  if (status !== "draft" && closesAt && new Date(closesAt).getTime() <= now) return "closed";
  if (status === "scheduled" && startsAt && new Date(startsAt).getTime() <= now) return "active";
  return status;
}

function submissionExpired(
  exam: { duration_minutes: number; closes_at: string | null },
  startedAt: string,
  status: ClassExamStatus,
) {
  if (status === "closed") return true;
  const durationDeadline = new Date(startedAt).getTime() + exam.duration_minutes * 60_000;
  const closeDeadline = exam.closes_at ? new Date(exam.closes_at).getTime() : Number.POSITIVE_INFINITY;
  return Math.min(durationDeadline, closeDeadline) <= Date.now();
}
