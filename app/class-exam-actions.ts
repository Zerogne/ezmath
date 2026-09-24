"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeChoices, parseChoices } from "@/lib/class-exams/choices";
import { MAX_CLASS_EXAM_ACTION_BYTES, serializedClassExamBytes } from "@/lib/class-exams/types";
import { requireApprovedTeacher, requireStudent } from "@/lib/data/classrooms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json, SchoolLibraryAnswerType } from "@/lib/supabase/database.types";
import type { ClassExamQuestionInput, ClassExamQuestionPayload, ClassExamStudentAnswer, CreateClassExamInput } from "@/lib/class-exams/types";

type ActionResult = { success?: true; id?: string; error?: string };

export async function createClassExam(input: CreateClassExamInput): Promise<ActionResult> {
  const { user, profile } = await requireApprovedTeacher(`/teacher/classes/${input.classroomId}/exams/new`);
  if (!profile.school_id) return { error: "Сургуулийн мэдээлэл олдсонгүй." };
  if (serializedClassExamBytes(input) > MAX_CLASS_EXAM_ACTION_BYTES) return { error: "Шалгалтын агуулга хэт том байна." };
  const title = String(input.title ?? "").trim();
  const instructions = String(input.instructions ?? "").trim();
  const durationMinutes = Number(input.durationMinutes);
  if (title.length < 2 || title.length > 160) return { error: "Шалгалтын нэр 2–160 тэмдэгт байна." };
  if (instructions.length > 5_000) return { error: "Заавар хэт урт байна." };
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) return { error: "Хугацаа 1–600 минут байна." };
  if (!Array.isArray(input.questions) || !input.questions.length || input.questions.length > 100) return { error: "1–100 асуулт сонгоно уу." };

  const admin = createAdminClient();
  const { data: classroom } = await admin
    .from("classrooms")
    .select("id, school_id, teacher_id")
    .eq("id", input.classroomId)
    .eq("teacher_id", user.id)
    .eq("school_id", profile.school_id)
    .maybeSingle();
  if (!classroom) return { error: "Анги олдсонгүй эсвэл танд хамаарахгүй байна." };

  const schedule = validateSchedule(input.publishMode, input.startsAt, input.closesAt);
  if ("error" in schedule) return { error: schedule.error };

  const materialIds = [...new Set(input.questions.flatMap((question) => question.sourceMaterialId ? [question.sourceMaterialId] : []))];
  const { data: materials } = materialIds.length
    ? await admin
        .from("school_library_materials")
        .select("id, title, topic, question_latex, answer_type, answer_key, choices")
        .eq("school_id", profile.school_id)
        .in("id", materialIds)
    : { data: [] };
  const materialMap = new Map((materials ?? []).map((material) => [material.id, material]));
  if (materialMap.size !== materialIds.length) return { error: "Сонгосон материалын зарим нь олдсонгүй." };

  const prepared: Array<Omit<ClassExamQuestionInput, "localId" | "saveToLibrary">> = [];
  for (const raw of input.questions) {
    const maxPoints = Number(raw.maxPoints);
    if (!Number.isFinite(maxPoints) || maxPoints <= 0 || maxPoints > 1_000) return { error: "Асуултын оноо 0-ээс их, 1000-аас бага байна." };
    let candidate: Omit<ClassExamQuestionInput, "localId" | "saveToLibrary">;
    if (isLibraryQuestion(raw)) {
      const material = materialMap.get(raw.sourceMaterialId);
      if (!material) return { error: "Сонгосон материал олдсонгүй." };
      candidate = {
          sourceMaterialId: material.id,
          title: material.title,
          topic: material.topic,
          questionLatex: material.question_latex,
          answerType: material.answer_type,
          answerKey: material.answer_key,
          choices: parseChoices(material.choices),
          maxPoints,
        };
    } else {
      candidate = {
        sourceMaterialId: undefined,
        title: raw.title,
        topic: raw.topic,
        questionLatex: raw.questionLatex,
        answerType: raw.answerType,
        answerKey: raw.answerKey,
        choices: raw.choices,
        maxPoints,
      };
    }
    const validated = validateQuestion(candidate);
    if ("error" in validated) return { error: validated.error };
    prepared.push(validated.question);
  }

  const { data: exam, error: examError } = await admin
    .from("class_exams")
    .insert({
      classroom_id: classroom.id,
      school_id: classroom.school_id,
      teacher_id: user.id,
      title,
      instructions,
      duration_minutes: durationMinutes,
      starts_at: schedule.startsAt,
      closes_at: schedule.closesAt,
      status: schedule.status,
    })
    .select("id")
    .single();
  if (examError || !exam) return { error: "Шалгалт үүсгэж чадсангүй." };

  const questionRows = prepared.map((question, index) => ({
    exam_id: exam.id,
    source_material_id: question.sourceMaterialId ?? null,
    position: index + 1,
    title: question.title,
    topic: question.topic,
    question_latex: question.questionLatex,
    answer_type: question.answerType,
    answer_key: question.answerKey,
    choices: question.choices as unknown as Json,
    max_points: question.maxPoints,
  }));
  const { error: questionsError } = await admin.from("class_exam_questions").insert(questionRows);
  if (questionsError) {
    await admin.from("class_exams").delete().eq("id", exam.id).eq("teacher_id", user.id);
    return { error: "Шалгалтын асуултуудыг хадгалж чадсангүй." };
  }

  const libraryRows = input.questions.flatMap((question) => {
    if (isLibraryQuestion(question) || !question.saveToLibrary) return [];
    return [{
      school_id: profile.school_id!,
      created_by: user.id,
      title: String(question.title).trim(),
      topic: String(question.topic).trim(),
      question_latex: String(question.questionLatex).trim(),
      answer_type: question.answerType,
      answer_key: String(question.answerKey).trim(),
      choices: (question.answerType === "multiple_choice" ? normalizeChoices(question.choices) : []) as unknown as Json,
    }];
  });
  if (libraryRows.length) {
    const { error } = await admin.from("school_library_materials").insert(libraryRows);
    if (error) console.error("Ad hoc exam questions could not be copied to the school library", { examId: exam.id, error });
  }

  revalidatePath(`/teacher/classes/${classroom.id}`);
  revalidatePath("/dashboard/exams");
  return { success: true, id: exam.id };
}

export async function startClassExamSubmission(examId: string): Promise<ActionResult> {
  const { user } = await requireStudent(`/dashboard/exams/${examId}`);
  const admin = createAdminClient();
  const { data: exam } = await admin
    .from("class_exams")
    .select("id, classroom_id, duration_minutes, starts_at, closes_at, status")
    .eq("id", examId)
    .maybeSingle();
  if (!exam) return { error: "Шалгалт олдсонгүй." };
  const { data: membership } = await admin
    .from("classroom_students")
    .select("classroom_id")
    .eq("classroom_id", exam.classroom_id)
    .eq("student_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "Энэ шалгалт таны ангид хамаарахгүй байна." };
  const now = new Date();
  if (!exam.starts_at || new Date(exam.starts_at) > now) return { error: "Шалгалтын эхлэх цаг болоогүй байна." };
  if (exam.status === "draft" || exam.status === "closed" || (exam.closes_at && new Date(exam.closes_at) <= now)) return { error: "Энэ шалгалт хаагдсан байна." };

  const { data: existing } = await admin
    .from("class_exam_submissions")
    .select("id, status")
    .eq("exam_id", exam.id)
    .eq("student_id", user.id)
    .maybeSingle();
  if (existing?.status !== undefined) {
    if (existing.status !== "in_progress") return { error: "Та энэ шалгалтыг аль хэдийн илгээсэн байна.", id: existing.id };
    return { success: true, id: existing.id };
  }

  const { data: questions } = await admin.from("class_exam_questions").select("max_points").eq("exam_id", exam.id);
  const maxScore = (questions ?? []).reduce((sum, question) => sum + Number(question.max_points), 0);
  if (!maxScore) return { error: "Шалгалтад асуулт алга байна." };
  const { data: submission, error } = await admin
    .from("class_exam_submissions")
    .insert({ exam_id: exam.id, student_id: user.id, status: "in_progress", max_score: maxScore })
    .select("id")
    .single();
  if (error || !submission) return { error: "Шалгалтыг эхлүүлж чадсангүй." };
  if (exam.status === "scheduled") await admin.from("class_exams").update({ status: "active" }).eq("id", exam.id).eq("status", "scheduled");
  return { success: true, id: submission.id };
}

export async function submitClassExam(examId: string, answers: ClassExamStudentAnswer[]): Promise<ActionResult> {
  await requireStudent(`/dashboard/exams/${examId}/take`);
  const safeAnswers = Array.isArray(answers) ? answers.slice(0, 100) : [];
  if (serializedClassExamBytes(safeAnswers) > MAX_CLASS_EXAM_ACTION_BYTES) return { error: "Хариултын нийт хэмжээ хэт том байна." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_class_exam", {
    p_exam_id: examId,
    p_answers: safeAnswers as unknown as Json,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    console.error("Class exam submission RPC failed", { examId, code: error?.code });
    return { error: "Шалгалтыг илгээж чадсангүй. Дахин оролдоно уу." };
  }
  const submissionId = typeof data.submissionId === "string" ? data.submissionId : undefined;
  if (!submissionId) return { error: "Шалгалтын илгээлтийг баталгаажуулж чадсангүй." };
  revalidatePath(`/dashboard/exams/${examId}`);
  revalidatePath(`/teacher/exams/${examId}`);
  return { success: true, id: submissionId };
}

export async function closeClassExam(formData: FormData) {
  const examId = String(formData.get("examId") ?? "");
  const { user } = await requireApprovedTeacher(`/teacher/exams/${examId}`);
  const admin = createAdminClient();
  const { data, error } = await admin.from("class_exams").update({ status: "closed" }).eq("id", examId).eq("teacher_id", user.id).select("id").maybeSingle();
  if (error || !data) redirect(`/teacher/exams/${examId}?error=close-failed`);
  revalidatePath(`/teacher/exams/${examId}`);
  revalidatePath("/dashboard/exams");
}

export async function activateClassExam(formData: FormData) {
  const examId = String(formData.get("examId") ?? "");
  const { user } = await requireApprovedTeacher(`/teacher/exams/${examId}`);
  const admin = createAdminClient();
  const { data, error } = await admin.from("class_exams").update({ status: "active", starts_at: new Date().toISOString() }).eq("id", examId).eq("teacher_id", user.id).eq("status", "draft").select("id").maybeSingle();
  if (error || !data) redirect(`/teacher/exams/${examId}?error=activate-failed`);
  revalidatePath(`/teacher/exams/${examId}`);
  revalidatePath("/dashboard/exams");
}

export async function gradeClassExamSubmission(formData: FormData) {
  const submissionId = String(formData.get("submissionId") ?? "");
  const examId = String(formData.get("examId") ?? "");
  const { user } = await requireApprovedTeacher(`/teacher/exams/${examId}/submissions/${submissionId}`);
  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("class_exam_submissions")
    .select("id, exam_id, status, auto_score, max_score")
    .eq("id", submissionId)
    .eq("exam_id", examId)
    .neq("status", "in_progress")
    .maybeSingle();
  const { data: exam } = submission ? await admin.from("class_exams").select("id, teacher_id").eq("id", submission.exam_id).eq("teacher_id", user.id).maybeSingle() : { data: null };
  if (!submission || !exam) redirect(`/teacher/exams/${examId}?error=not-found`);
  const { data: answers } = await admin
    .from("class_exam_answers")
    .select("id, question_id")
    .eq("submission_id", submission.id);
  const questionIds = (answers ?? []).map((answer) => answer.question_id);
  const { data: questions } = questionIds.length
    ? await admin.from("class_exam_questions").select("id, answer_type, max_points").in("id", questionIds).eq("exam_id", examId)
    : { data: [] };
  const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));
  let manualScore = 0;
  const answerUpdates = [];
  for (const answer of answers ?? []) {
    const question = questionMap.get(answer.question_id);
    if (question?.answer_type !== "free_response") continue;
    const rawScore = Number(formData.get(`score:${answer.id}`) ?? 0);
    const score = Math.max(0, Math.min(Number(question.max_points), Number.isFinite(rawScore) ? rawScore : 0));
    const feedback = String(formData.get(`feedback:${answer.id}`) ?? "").trim().slice(0, 2_000);
    manualScore += score;
    answerUpdates.push(admin.from("class_exam_answers").update({ manual_score: score, teacher_feedback: feedback }).eq("id", answer.id).eq("submission_id", submission.id));
  }
  const answerResults = await Promise.all(answerUpdates);
  if (answerResults.some((result) => result.error)) redirect(`/teacher/exams/${examId}?error=grade-failed`);
  const totalScore = Math.min(Number(submission.max_score), Number(submission.auto_score) + manualScore);
  const { data: gradedSubmission, error: gradeError } = await admin.from("class_exam_submissions").update({
    status: "graded",
    graded_at: new Date().toISOString(),
    manual_score: manualScore,
    total_score: totalScore,
    needs_manual_grading: false,
    teacher_feedback: String(formData.get("teacherFeedback") ?? "").trim().slice(0, 5_000),
  }).eq("id", submission.id).neq("status", "in_progress").select("id").maybeSingle();
  if (gradeError || !gradedSubmission) redirect(`/teacher/exams/${examId}?error=grade-failed`);
  revalidatePath(`/teacher/exams/${examId}`);
  revalidatePath(`/teacher/exams/${examId}/submissions/${submissionId}`);
  revalidatePath(`/dashboard/exams/${examId}`);
  redirect(`/teacher/exams/${examId}?graded=1`);
}

function validateSchedule(mode: CreateClassExamInput["publishMode"], startsAt?: string, closesAt?: string) {
  const now = new Date();
  if (!(["draft", "immediate", "scheduled"] as const).includes(mode)) return { error: "Шалгалтын төлөв буруу байна." } as const;
  const start = mode === "draft" ? null : mode === "immediate" ? now : parseDate(startsAt);
  const close = mode === "draft" ? null : closesAt ? parseDate(closesAt) : null;
  if (mode === "scheduled" && !start) return { error: "Эхлэх огноо, цагаа оруулна уу." } as const;
  if (mode === "scheduled" && start && start <= now) return { error: "Товлосон эхлэх цаг ирээдүйд байна." } as const;
  if (closesAt && !close) return { error: "Хаагдах огноо, цаг буруу байна." } as const;
  if (close && (!start || close <= start)) return { error: "Хаагдах цаг эхлэх цагаас хойш байна." } as const;
  return {
    status: mode === "draft" ? "draft" as const : mode === "immediate" ? "active" as const : "scheduled" as const,
    startsAt: start?.toISOString() ?? null,
    closesAt: close?.toISOString() ?? null,
  };
}

function validateQuestion(raw: Omit<ClassExamQuestionInput, "localId" | "saveToLibrary"> | ClassExamQuestionInput) {
  const title = String(raw.title ?? "").trim();
  const topic = String(raw.topic ?? "").trim();
  const questionLatex = String(raw.questionLatex ?? "").trim();
  const answerType = raw.answerType as SchoolLibraryAnswerType;
  const answerKey = String(raw.answerKey ?? "").trim();
  const maxPoints = Number(raw.maxPoints);
  if (title.length < 2 || title.length > 160) return { error: "Асуултын гарчиг 2–160 тэмдэгт байна." } as const;
  if (!topic || topic.length > 80) return { error: "Асуулт бүр сэдэвтэй байна." } as const;
  if (!questionLatex || questionLatex.length > 12_000) return { error: "Асуултын текстийг оруулна уу." } as const;
  if (!(<SchoolLibraryAnswerType[]>["multiple_choice", "numeric", "free_response"]).includes(answerType)) return { error: "Хариултын төрөл буруу байна." } as const;
  if (!answerKey || answerKey.length > 2_000) return { error: "Зөв эсвэл жишиг хариуг оруулна уу." } as const;
  if (!Number.isFinite(maxPoints) || maxPoints <= 0 || maxPoints > 1_000) return { error: "Асуултын оноо буруу байна." } as const;
  const choices = answerType === "multiple_choice" ? normalizeChoices(raw.choices) : [];
  if (answerType === "multiple_choice" && (choices.length < 2 || choices.length > 8 || choices.some((choice) => !choice.text))) return { error: "Сонголттой асуулт 2–8 бүрэн хариулттай байна." } as const;
  const normalizedKey = answerType === "multiple_choice" ? answerKey.toUpperCase() : answerKey;
  if (answerType === "multiple_choice" && !choices.some((choice) => choice.label === normalizedKey)) return { error: "Зөв сонголтыг тэмдэглэнэ үү." } as const;
  return { question: { sourceMaterialId: raw.sourceMaterialId, title, topic, questionLatex, answerType, answerKey: normalizedKey, choices, maxPoints } } as const;
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isLibraryQuestion(question: ClassExamQuestionPayload): question is Extract<ClassExamQuestionPayload, { sourceMaterialId: string }> {
  return typeof question.sourceMaterialId === "string" && question.sourceMaterialId.length > 0;
}
