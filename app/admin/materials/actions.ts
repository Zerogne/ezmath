"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminIdentity } from "@/lib/admin/auth";
import type { MaterialEditorData } from "@/lib/admin/material-types";

export type SaveMaterialResult = { id?: string; error?: string };
export type MaterialActionResult = { success?: true; error?: string };

function validate(payload: MaterialEditorData) {
  if (!payload.title.trim() || !payload.subject.trim() || payload.durationMinutes <= 0) return "Гарчиг, хичээл болон хугацааг зөв бөглөнө үү.";
  if (!payload.questions.length) return "Дор хаяж нэг асуулт нэмнэ үү.";
  for (const [index, question] of payload.questions.entries()) {
    if (!question.text.trim()) return `${index + 1}-р асуултын текстийг оруулна уу.`;
    if (question.questionType === "multiple-choice") {
      const completedChoices = question.choices.filter((choice) => choice.text.trim() || choice.imageUrl);
      if (payload.status === "published" && completedChoices.length < 2) return `${index + 1}-р асуултын сонголтуудыг бүрэн бөглөнө үү.`;
      if (payload.status === "published" && !completedChoices.some((choice) => choice.label === question.correctAnswer)) return `${index + 1}-р асуултын зөв хариултыг сонгоно уу.`;
    } else {
      if (payload.status === "published" && !question.responseFields.length) return `${index + 1}-р асуултын хариултын талбарыг нэмнэ үү.`;
      if (payload.status === "published" && question.responseFields.some((field) => !field.label.trim() || !field.acceptedAnswers.some((answer) => answer.trim()))) return `${index + 1}-р асуултын хариултын нэр болон зөв хариуг бөглөнө үү.`;
    }
  }
}

export async function saveMaterial(payload: MaterialEditorData): Promise<SaveMaterialResult> {
  const admin = await getAdminIdentity();
  if (!admin) return { error: "Админ эрх шаардлагатай." };
  const validationError = validate(payload);
  if (validationError) return { error: validationError };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_admin_material", {
    p_test_id: payload.id ?? null,
    p_exam_type: payload.examType,
    p_title: payload.title,
    p_subject: payload.subject,
    p_year: payload.examType === "EYESH" ? payload.year ?? null : null,
    p_duration_minutes: payload.durationMinutes,
    p_test_type: payload.type,
    p_status: payload.status,
    p_instructions: payload.description,
    p_questions: payload.questions,
  });
  if (error) return { error: error.message || "Материал хадгалж чадсангүй." };
  const adminClient = createAdminClient();
  const { data: ownedQuestions } = await adminClient.from("questions").select("id").eq("test_id", data);
  const ownedQuestionIds = new Set((ownedQuestions ?? []).map((question) => question.id));
  const scopedQuestions = payload.questions.filter((question) => ownedQuestionIds.has(question.id));
  const { error: testMetadataError } = await adminClient.from("tests").update({ variant: payload.examType === "EYESH" ? payload.variant ?? null : null }).eq("id", data);
  const questionUpdates = await Promise.all(scopedQuestions.map((question) => adminClient.from("questions").update({ image_url: question.imageUrl || null, question_type: question.questionType, response_fields: question.responseFields.map(({ id, label }) => ({ id, label })) }).eq("id", question.id).eq("test_id", data)));
  const choiceUpdates = await Promise.all(scopedQuestions.flatMap((question) => question.choices.map((choice) => adminClient.from("answer_choices").update({ image_url: choice.imageUrl || null }).eq("id", choice.id).eq("question_id", question.id))));
  const { error: clearResponseAnswersError } = await adminClient.from("question_response_answers").delete().in("question_id", scopedQuestions.map((question) => question.id));
  const responseAnswers = scopedQuestions.flatMap((question) => question.responseFields.map((field) => ({ question_id: question.id, field_id: field.id, accepted_answers: field.acceptedAnswers.filter((answer) => answer.trim()) })));
  const responseAnswersError = responseAnswers.length ? (await adminClient.from("question_response_answers").insert(responseAnswers)).error : null;
  if (testMetadataError || questionUpdates.some((result) => result.error) || choiceUpdates.some((result) => result.error) || clearResponseAnswersError || responseAnswersError) return { error: "Материалын нэмэлт мэдээллийг хадгалж чадсангүй." };
  revalidatePath("/");
  revalidatePath("/tests");
  revalidatePath("/admin");
  revalidatePath("/admin/materials");
  return { id: data };
}

export async function setMaterialStatus(testId: string, status: "draft" | "published" | "archived"): Promise<MaterialActionResult> {
  if (!await getAdminIdentity()) return { error: "Админ эрх шаардлагатай." };
  const admin = createAdminClient();
  if (status === "published") {
    const { data: questions, error: questionError } = await admin.from("questions").select("id,question_type,response_fields").eq("test_id", testId);
    if (questionError || !questions?.length) return { error: "Нийтлэхийн өмнө тестэд асуулт нэмнэ үү." };
    const questionIds = questions.map((question) => question.id);
    const [{ data: choices, error: choiceError }, { data: responseAnswers, error: responseError }] = await Promise.all([
      admin.from("answer_choices").select("question_id,text,image_url,is_correct").in("question_id", questionIds),
      admin.from("question_response_answers").select("question_id,field_id,accepted_answers").in("question_id", questionIds),
    ]);
    if (choiceError || responseError) return { error: "Асуултын хариултыг шалгаж чадсангүй." };
    const incomplete = questions.some((question) => {
      if (question.question_type === "multi-blank") {
        const fields = Array.isArray(question.response_fields) ? question.response_fields as { id?: string; label?: string }[] : [];
        return !fields.length || fields.some((field) => !field.label?.trim() || !(responseAnswers ?? []).some((answer) => answer.question_id === question.id && answer.field_id === field.id && (answer.accepted_answers as string[]).some((value: string) => value.trim())));
      }
      const questionChoices = (choices ?? []).filter((choice) => choice.question_id === question.id && (choice.text.trim() || choice.image_url));
      return questionChoices.length < 2 || !questionChoices.some((choice) => choice.is_correct);
    });
    if (incomplete) return { error: "Зөв хариулт эсвэл сонголт дутуу асуулт байна. Тестийг засаж дуусгаад нийтэлнэ үү." };
  }
  const { error } = await admin.from("tests").update({ status }).eq("id", testId);
  if (error) return { error: error.message || "Тестийн төлөв шинэчилж чадсангүй." };
  revalidatePath("/tests");
  revalidatePath("/admin/materials/sat");
  revalidatePath("/admin/materials/eyesh");
  return { success: true };
}

export async function deleteMaterial(testId: string): Promise<MaterialActionResult> {
  if (!await getAdminIdentity()) return { error: "Админ эрх шаардлагатай." };
  const admin = createAdminClient();
  const { count, error: countError } = await admin.from("test_attempts").select("id", { count: "exact", head: true }).eq("test_id", testId);
  if (countError) return { error: "Тестийн оролдлогыг шалгаж чадсангүй." };
  if ((count ?? 0) > 0) return { error: `Энэ тестэд ${count} сурагчийн оролдлого байна. Түүхийг хадгалахын тулд устгахын оронд Archive хийнэ үү.` };
  const { error } = await admin.from("tests").delete().eq("id", testId);
  if (error) return { error: error.message || "Тест устгаж чадсангүй." };
  revalidatePath("/tests");
  revalidatePath("/admin/materials/sat");
  revalidatePath("/admin/materials/eyesh");
  return { success: true };
}
