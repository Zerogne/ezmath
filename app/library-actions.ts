"use server";

import { revalidatePath } from "next/cache";
import { normalizeChoices } from "@/lib/class-exams/choices";
import { createClient } from "@/lib/supabase/server";
import type { Json, SchoolLibraryAnswerType } from "@/lib/supabase/database.types";
import type { LibraryChoice } from "@/lib/data/school-library";

export type LibraryMaterialInput = {
  id?: string;
  title: string;
  topic: string;
  questionLatex: string;
  answerType: SchoolLibraryAnswerType;
  answerKey: string;
  choices: LibraryChoice[];
};

type ActionResult = { success?: true; id?: string; error?: string };

async function libraryActor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Нэвтэрсний дараа дахин оролдоно уу." } as const;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id, teacher_status")
    .eq("id", user.id)
    .maybeSingle();
  const allowed = profile?.role === "school_admin" || (profile?.role === "teacher" && profile.teacher_status === "approved");
  if (!allowed || !profile?.school_id) return { error: "Бодлогын санг өөрчлөх эрхгүй байна." } as const;
  return { supabase, user, schoolId: profile.school_id } as const;
}

export async function saveLibraryMaterial(input: LibraryMaterialInput): Promise<ActionResult> {
  const actor = await libraryActor();
  if ("error" in actor) return { error: actor.error };
  const validated = validateMaterial(input);
  if ("error" in validated) return { error: validated.error };

  const values = {
    title: validated.title,
    topic: validated.topic,
    question_latex: validated.questionLatex,
    answer_type: validated.answerType,
    answer_key: validated.answerKey,
    choices: validated.choices as unknown as Json,
  };

  const query = input.id
    ? actor.supabase.from("school_library_materials").update(values).eq("id", input.id).select("id").maybeSingle()
    : actor.supabase.from("school_library_materials").insert({ ...values, school_id: actor.schoolId, created_by: actor.user.id }).select("id").single();
  const { data, error } = await query;
  if (error || !data) return { error: input.id ? "Материалыг засах эрхгүй эсвэл материал олдсонгүй." : "Материал хадгалж чадсангүй." };

  revalidateLibrary();
  return { success: true, id: data.id };
}

export async function deleteLibraryMaterial(materialId: string): Promise<ActionResult> {
  if (!materialId) return { error: "Материалын дугаар буруу байна." };
  const actor = await libraryActor();
  if ("error" in actor) return { error: actor.error };
  const { data, error } = await actor.supabase
    .from("school_library_materials")
    .delete()
    .eq("id", materialId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: "Материалыг устгах эрхгүй эсвэл материал олдсонгүй." };
  revalidateLibrary();
  return { success: true, id: data.id };
}

function revalidateLibrary() {
  revalidatePath("/teacher/library");
  revalidatePath("/school/library");
}

function validateMaterial(input: LibraryMaterialInput) {
  const title = String(input.title ?? "").trim();
  const topic = String(input.topic ?? "").trim();
  const questionLatex = String(input.questionLatex ?? "").trim();
  const answerKey = String(input.answerKey ?? "").trim();
  const answerType = input.answerType;
  if (title.length < 2 || title.length > 160) return { error: "Гарчиг 2–160 тэмдэгт байна." } as const;
  if (!topic || topic.length > 80) return { error: "Сэдвийг 1–80 тэмдэгтээр оруулна уу." } as const;
  if (!questionLatex || questionLatex.length > 12_000) return { error: "Асуултын текстийг оруулна уу." } as const;
  if (!(["multiple_choice", "numeric", "free_response"] as const).includes(answerType)) return { error: "Хариултын төрөл буруу байна." } as const;
  if (!answerKey || answerKey.length > 2_000) return { error: answerType === "free_response" ? "Жишиг хариу эсвэл үнэлгээний зааврыг оруулна уу." : "Зөв хариуг оруулна уу." } as const;

  let choices: LibraryChoice[] = [];
  if (answerType === "multiple_choice") {
    if (!Array.isArray(input.choices) || input.choices.length < 2 || input.choices.length > 8) return { error: "Сонголттой асуулт 2–8 хариулттай байна." } as const;
    choices = normalizeChoices(input.choices);
    if (choices.some((choice) => !choice.text)) return { error: "Сонголт бүрийн утгыг оруулна уу." } as const;
    if (!choices.some((choice) => choice.label === answerKey.toUpperCase())) return { error: "Зөв сонголтыг тэмдэглэнэ үү." } as const;
  }

  return { title, topic, questionLatex, answerType, answerKey: answerType === "multiple_choice" ? answerKey.toUpperCase() : answerKey, choices };
}
