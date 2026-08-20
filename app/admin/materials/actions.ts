"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity } from "@/lib/admin/auth";
import type { MaterialEditorData } from "@/lib/admin/material-types";

export type SaveMaterialResult = { id?: string; error?: string };

function validate(payload: MaterialEditorData) {
  if (!payload.title.trim() || !payload.subject.trim() || payload.durationMinutes <= 0) return "Гарчиг, хичээл болон хугацааг зөв бөглөнө үү.";
  if (!payload.questions.length) return "Дор хаяж нэг асуулт нэмнэ үү.";
  for (const [index, question] of payload.questions.entries()) {
    const completedChoices = question.choices.filter((choice) => choice.text.trim());
    if (!question.text.trim() || completedChoices.length < 2) return `${index + 1}-р асуултын текст болон сонголтуудыг бүрэн бөглөнө үү.`;
    if (!completedChoices.some((choice) => choice.label === question.correctAnswer)) return `${index + 1}-р асуултын зөв хариултыг сонгоно уу.`;
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
  revalidatePath("/");
  revalidatePath("/tests");
  revalidatePath("/admin");
  revalidatePath("/admin/materials");
  return { id: data };
}
