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

export type LibraryCollectionProblemInput = Omit<LibraryMaterialInput, "title"> & { title?: string };
export type LibraryCollectionInput = {
  id?: string;
  title: string;
  subject: string;
  year?: number | null;
  variant?: string | null;
  description: string;
  problems: LibraryCollectionProblemInput[];
};

const MAX_COLLECTION_PROBLEMS = 200;

export async function saveLibraryCollection(input: LibraryCollectionInput): Promise<ActionResult> {
  const actor = await libraryActor();
  if ("error" in actor) return { error: actor.error };
  const title = String(input.title ?? "").trim();
  const subject = String(input.subject ?? "").trim();
  const description = String(input.description ?? "").trim();
  const year = input.year ? Number(input.year) : null;
  const variant = input.variant ? String(input.variant).toUpperCase() : null;
  if (title.length < 2 || title.length > 160) return { error: "Материалын нэр 2–160 тэмдэгт байна." };
  if (!subject || subject.length > 80) return { error: "Хичээл / сэдвийг оруулна уу." };
  if (description.length > 2_000) return { error: "Тайлбар 2000 тэмдэгтээс хэтрэхгүй." };
  if (year !== null && (!Number.isInteger(year) || year < 2000 || year > 2100)) return { error: "Он буруу байна." };
  if (variant !== null && !["A", "B", "C", "D", "E"].includes(variant)) return { error: "Хувилбар A–E байна." };
  if (!Array.isArray(input.problems) || !input.problems.length) return { error: "Дор хаяж нэг бодлого нэмнэ үү." };
  if (input.problems.length > MAX_COLLECTION_PROBLEMS) return { error: `Нэг материалд ${MAX_COLLECTION_PROBLEMS} хүртэл бодлого байна.` };

  // Only ids that already belong to this collection may be updated; anything else is inserted as new.
  let knownIds = new Set<string>();
  if (input.id) {
    const { data } = await actor.supabase.from("school_library_materials").select("id").eq("collection_id", input.id);
    knownIds = new Set((data ?? []).map((row) => row.id));
  }

  const problems = [];
  for (const [index, problem] of input.problems.entries()) {
    // Problems inside a material are identified by their number; the title is derived unless one was typed.
    const validated = validateMaterial({
      ...problem,
      title: String(problem.title ?? "").trim() || `${title} — ${index + 1}`.slice(0, 160),
      topic: String(problem.topic ?? "").trim() || subject,
    });
    if ("error" in validated) return { error: `${index + 1}-р бодлого: ${validated.error}` };
    problems.push({
      id: problem.id && knownIds.has(problem.id) ? problem.id : null,
      title: validated.title,
      topic: validated.topic,
      question_latex: validated.questionLatex,
      answer_type: validated.answerType,
      answer_key: validated.answerKey,
      choices: validated.choices,
    });
  }

  const { data, error } = await actor.supabase.rpc("save_school_library_collection", {
    p_collection_id: input.id ?? null,
    p_title: title,
    p_subject: subject,
    p_year: year,
    p_variant: variant,
    p_description: description,
    p_problems: problems as unknown as Json,
  });
  if (error || !data) return { error: input.id ? "Материалыг засах эрхгүй эсвэл материал олдсонгүй." : "Материал хадгалж чадсангүй." };
  revalidateLibrary();
  return { success: true, id: data };
}

export async function deleteLibraryCollection(collectionId: string): Promise<ActionResult> {
  if (!collectionId) return { error: "Материалын дугаар буруу байна." };
  const actor = await libraryActor();
  if ("error" in actor) return { error: actor.error };
  // Deleting cascades to its problems. Exams already given keep their own copies of the questions.
  const { data, error } = await actor.supabase.from("school_library_collections").delete().eq("id", collectionId).select("id").maybeSingle();
  if (error || !data) return { error: "Материалыг устгах эрхгүй эсвэл материал олдсонгүй." };
  revalidateLibrary();
  return { success: true, id: data.id };
}

function revalidateLibrary() {
  revalidatePath("/teacher/library", "layout");
  revalidatePath("/school/library", "layout");
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
