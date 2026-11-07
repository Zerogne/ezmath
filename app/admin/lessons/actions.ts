"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/auth";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { listAllModules } from "@/lib/data/course-catalog";
import { createClient } from "@/lib/supabase/server";

export type LessonFormState = { error?: string; success?: string; id?: string };
export type LessonActionResult = { error?: string; success?: true };
export type ModuleFormState = { error?: string; success?: string };

type PracticeColumns = { example: string | null; test_problem: string | null; test_answer: string | null };

/** The optional example and test problem (with answer) shared by modules, submodules and topics. */
function parsePractice(formData: FormData): PracticeColumns | { error: string } {
  const example = String(formData.get("example") ?? "").trim();
  const problem = String(formData.get("testProblem") ?? "").trim();
  const answer = String(formData.get("testAnswer") ?? "").trim();
  if (example.length > 4000 || problem.length > 4000) return { error: "Жишээ болон тест бодлого 4000 тэмдэгтээс хэтрэхгүй." };
  if (answer.length > 300) return { error: "Хариу 300 тэмдэгтээс хэтрэхгүй." };
  if (problem && !answer) return { error: "Тест бодлогын зөв хариуг оруулна уу." };
  if (answer && !problem) return { error: "Хариуны өмнө тест бодлогоо оруулна уу." };
  return { example: example || null, test_problem: problem || null, test_answer: answer || null };
}

type ParsedLesson = {
  title: string;
  moduleId: string;
  summary: string;
  durationMinutes: number;
  sortOrder: number;
  status: "draft" | "published";
  objectives: string[];
  sections: { title: string; body: string; example?: string }[];
  practice: PracticeColumns;
};

function parseLesson(formData: FormData, validModuleIds: Set<string>): ParsedLesson | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const moduleId = String(formData.get("moduleId") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  const sortOrderRaw = formData.get("sortOrder");
  const sortOrder = sortOrderRaw === null ? 100 : Number(sortOrderRaw);
  const status = formData.get("status") === "published" ? "published" as const : "draft" as const;
  const objectives = String(formData.get("objectives") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
  const sectionCount = Math.max(0, Math.min(10, Number(formData.get("sectionCount")) || 0));
  const sections = Array.from({ length: sectionCount }, (_, index) => ({
    title: String(formData.get(`sectionTitle${index}`) ?? "").trim(),
    body: String(formData.get(`sectionBody${index}`) ?? "").trim(),
    example: String(formData.get(`sectionExample${index}`) ?? "").trim() || undefined,
  })).filter((item) => item.title && item.body);

  if (title.length < 3 || summary.length < 10 || !Number.isInteger(durationMinutes) || durationMinutes < 1) return { error: "Гарчиг, тайлбар болон хугацааг зөв бөглөнө үү." };
  if (!validModuleIds.has(moduleId)) return { error: "Сэдвийг дэд модульд хадгална. Дэд модулиа сонгоно уу." };
  if (!objectives.length) return { error: "Дор хаяж нэг зорилго нэмнэ үү." };
  if (status === "published" && !sections.length) return { error: "Нийтлэхийн тулд дор хаяж нэг агуулгын хэсэг нэмнэ үү." };
  const practice = parsePractice(formData);
  if ("error" in practice) return practice;

  return { title, moduleId, summary, durationMinutes, sortOrder: Number.isInteger(sortOrder) ? sortOrder : 100, status, objectives, sections, practice };
}

function generateSlug(prefix: string) {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function revalidateCatalog() {
  revalidatePath("/admin/lessons", "layout");
  revalidatePath("/lesson", "layout");
}

async function submoduleIds() {
  return new Set((await listAllModules()).filter((item) => item.parentId).map((item) => item.id));
}

function parseModuleFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (title.length < 3 || title.length > 160) return { error: "Нэр 3-160 тэмдэгт байх ёстой." };
  if (description.length > 500) return { error: "Тайлбар 500 тэмдэгтээс хэтрэхгүй." };
  const practice = parsePractice(formData);
  if ("error" in practice) return practice;
  return { title, description, practice };
}

export async function createModule(_: ModuleFormState, formData: FormData): Promise<ModuleFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };
  const fields = parseModuleFields(formData);
  if ("error" in fields) return fields;
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (parentId) {
    const parent = (await listAllModules()).find((item) => item.id === parentId);
    // Only two levels: a submodule's parent must itself be a main module.
    if (!parent || parent.parentId) return { error: "Дэд модулийг зөвхөн үндсэн модуль дотор нэмнэ." };
  }

  const supabase = await createClient();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabase.from("course_modules").insert({
      id: generateSlug("module"),
      course_slug: coreMathCourse.slug,
      title: fields.title,
      description: fields.description,
      ...fields.practice,
      parent_id: parentId,
      created_by: admin.id,
    });
    if (error?.code === "23505") continue;
    if (error) return { error: error.message || "Модуль үүсгэж чадсангүй." };
    revalidateCatalog();
    return { success: parentId ? "Дэд модуль нэмэгдлээ." : "Модуль нэмэгдлээ." };
  }
  return { error: "Модуль үүсгэж чадсангүй. Дахин оролдоно уу." };
}

export async function updateModule(_: ModuleFormState, formData: FormData): Promise<ModuleFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };
  const moduleId = String(formData.get("moduleId") ?? "");
  const target = (await listAllModules()).find((item) => item.id === moduleId);
  if (!target) return { error: "Модуль олдсонгүй." };
  if (target.builtin) return { error: "Үндсэн модулийг засах боломжгүй." };
  const fields = parseModuleFields(formData);
  if ("error" in fields) return fields;
  const supabase = await createClient();
  const { error } = await supabase.from("course_modules").update({ title: fields.title, description: fields.description, ...fields.practice }).eq("id", moduleId);
  if (error) return { error: error.message || "Модуль шинэчилж чадсангүй." };
  revalidateCatalog();
  return { success: "Хадгалагдлаа." };
}

export async function deleteModule(moduleId: string): Promise<LessonActionResult> {
  if (!await getAdminIdentity()) return { error: "Админ эрх шаардлагатай." };
  if ((await listAllModules()).some((item) => item.id === moduleId && item.builtin)) return { error: "Үндсэн модулийг устгах боломжгүй." };
  const supabase = await createClient();
  const [{ count: lessonCount }, { count: childCount }] = await Promise.all([
    supabase.from("course_lessons").select("id", { count: "exact", head: true }).eq("module_id", moduleId),
    supabase.from("course_modules").select("id", { count: "exact", head: true }).eq("parent_id", moduleId),
  ]);
  if ((lessonCount ?? 0) > 0) return { error: "Энэ дэд модульд сэдэв байна. Эхлээд тэдгээрийг устгах эсвэл зөөнө үү." };
  if ((childCount ?? 0) > 0) return { error: "Энэ модульд дэд модуль байна. Эхлээд тэдгээрийг устгана уу." };
  const { error } = await supabase.from("course_modules").delete().eq("id", moduleId);
  if (error) return { error: error.message || "Модуль устгаж чадсангүй." };
  revalidateCatalog();
  return { success: true };
}

export async function createLesson(_: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };
  const parsed = parseLesson(formData, await submoduleIds());
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase.from("course_lessons").insert({
      slug: generateSlug("lesson"),
      course_slug: coreMathCourse.slug,
      module_id: parsed.moduleId,
      title: parsed.title,
      duration_minutes: parsed.durationMinutes,
      summary: parsed.summary,
      objectives: parsed.objectives,
      sections: parsed.sections,
      ...parsed.practice,
      status: parsed.status,
      sort_order: parsed.sortOrder,
      created_by: admin.id,
    }).select("id").single();
    if (error?.code === "23505") continue;
    if (error || !data) return { error: error?.message || "Хичээл хадгалж чадсангүй." };
    revalidateCatalog();
    return { id: data.id, success: parsed.status === "published" ? "Сэдэв нийтлэгдлээ." : "Draft сэдэв хадгалагдлаа." };
  }
  return { error: "Хичээл хадгалж чадсангүй. Дахин оролдоно уу." };
}

export async function updateLesson(_: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!lessonId) return { error: "Сэдэв олдсонгүй." };
  const parsed = parseLesson(formData, await submoduleIds());
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").update({
    module_id: parsed.moduleId,
    title: parsed.title,
    duration_minutes: parsed.durationMinutes,
    summary: parsed.summary,
    objectives: parsed.objectives,
    sections: parsed.sections,
    ...parsed.practice,
    status: parsed.status,
    sort_order: parsed.sortOrder,
  }).eq("id", lessonId);
  if (error) return { error: error.message || "Хичээл шинэчилж чадсангүй." };
  revalidateCatalog();
  return { success: "Сэдэв шинэчлэгдлээ." };
}

export async function deleteLesson(lessonId: string): Promise<LessonActionResult> {
  if (!await getAdminIdentity()) return { error: "Админ эрх шаардлагатай." };
  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").delete().eq("id", lessonId);
  if (error) return { error: error.message || "Сэдэв устгаж чадсангүй." };
  revalidateCatalog();
  return { success: true };
}

export async function setLessonStatus(lessonId: string, status: "draft" | "published"): Promise<LessonActionResult> {
  if (!await getAdminIdentity()) return { error: "Админ эрх шаардлагатай." };
  const supabase = await createClient();
  if (status === "published") {
    const { data: lesson } = await supabase.from("course_lessons").select("sections").eq("id", lessonId).maybeSingle();
    const sections = Array.isArray(lesson?.sections) ? lesson.sections as { title?: unknown; body?: unknown }[] : [];
    if (!sections.some((item) => typeof item.title === "string" && item.title.trim() && typeof item.body === "string" && item.body.trim())) {
      return { error: "Нийтлэхийн тулд дор хаяж нэг агуулгын хэсэг нэмнэ үү." };
    }
  }
  const { error } = await supabase.from("course_lessons").update({ status }).eq("id", lessonId);
  if (error) return { error: error.message || "Төлөв шинэчилж чадсангүй." };
  revalidateCatalog();
  return { success: true };
}
