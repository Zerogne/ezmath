"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/auth";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { createClient } from "@/lib/supabase/server";

export type LessonFormState = { error?: string; success?: string; id?: string };
export type LessonActionResult = { error?: string; success?: true };

type ParsedLesson = {
  title: string;
  moduleId: string;
  summary: string;
  durationMinutes: number;
  sortOrder: number;
  status: "draft" | "published";
  objectives: string[];
  sections: { title: string; body: string; example?: string }[];
};

function parseLesson(formData: FormData): ParsedLesson | { error: string } {
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
  if (!coreMathCourse.modules.some((item) => item.id === moduleId)) return { error: "Хичээл буруу байна." };
  if (!objectives.length) return { error: "Дор хаяж нэг зорилго нэмнэ үү." };
  if (status === "published" && !sections.length) return { error: "Нийтлэхийн тулд дор хаяж нэг агуулгын хэсэг нэмнэ үү." };

  return { title, moduleId, summary, durationMinutes, sortOrder: Number.isInteger(sortOrder) ? sortOrder : 100, status, objectives, sections };
}

function generateSlug() {
  return `lesson-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

export async function createLesson(_: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };
  const parsed = parseLesson(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase.from("course_lessons").insert({
      slug: generateSlug(),
      course_slug: coreMathCourse.slug,
      module_id: parsed.moduleId,
      title: parsed.title,
      duration_minutes: parsed.durationMinutes,
      summary: parsed.summary,
      objectives: parsed.objectives,
      sections: parsed.sections,
      status: parsed.status,
      sort_order: parsed.sortOrder,
      created_by: admin.id,
    }).select("id").single();
    if (error?.code === "23505") continue;
    if (error || !data) return { error: error?.message || "Хичээл хадгалж чадсангүй." };
    revalidatePath("/admin/lessons");
    revalidatePath("/lesson");
    revalidatePath(`/lesson/${coreMathCourse.slug}`);
    return { id: data.id, success: parsed.status === "published" ? "Сэдэв нийтлэгдлээ." : "Draft сэдэв хадгалагдлаа." };
  }
  return { error: "Хичээл хадгалж чадсангүй. Дахин оролдоно уу." };
}

export async function updateLesson(_: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };
  const lessonId = String(formData.get("lessonId") ?? "");
  if (!lessonId) return { error: "Сэдэв олдсонгүй." };
  const parsed = parseLesson(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").update({
    module_id: parsed.moduleId,
    title: parsed.title,
    duration_minutes: parsed.durationMinutes,
    summary: parsed.summary,
    objectives: parsed.objectives,
    sections: parsed.sections,
    status: parsed.status,
    sort_order: parsed.sortOrder,
  }).eq("id", lessonId);
  if (error) return { error: error.message || "Хичээл шинэчилж чадсангүй." };
  revalidatePath("/admin/lessons");
  revalidatePath("/lesson");
  revalidatePath(`/lesson/${coreMathCourse.slug}`);
  return { success: "Сэдэв шинэчлэгдлээ." };
}

export async function deleteLesson(lessonId: string): Promise<LessonActionResult> {
  if (!await getAdminIdentity()) return { error: "Админ эрх шаардлагатай." };
  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").delete().eq("id", lessonId);
  if (error) return { error: error.message || "Сэдэв устгаж чадсангүй." };
  revalidatePath("/admin/lessons");
  revalidatePath("/lesson");
  return { success: true };
}

export async function setLessonStatus(lessonId: string, status: "draft" | "published"): Promise<LessonActionResult> {
  if (!await getAdminIdentity()) return { error: "Админ эрх шаардлагатай." };
  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").update({ status }).eq("id", lessonId);
  if (error) return { error: error.message || "Төлөв шинэчилж чадсангүй." };
  revalidatePath("/admin/lessons");
  revalidatePath("/lesson");
  return { success: true };
}
