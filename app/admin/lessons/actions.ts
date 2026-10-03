"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/auth";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { allLessons } from "@/lib/learning/course-catalog";
import { createClient } from "@/lib/supabase/server";

export type LessonFormState = { error?: string; success?: string; id?: string };
export type LessonActionResult = { error?: string; success?: true };

type ParsedLesson = {
  title: string;
  slug: string;
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
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const moduleId = String(formData.get("moduleId") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  const sortOrder = Number(formData.get("sortOrder"));
  const status = formData.get("status") === "published" ? "published" as const : "draft" as const;
  const objectives = String(formData.get("objectives") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
  const sectionCount = Math.max(0, Math.min(10, Number(formData.get("sectionCount")) || 0));
  const sections = Array.from({ length: sectionCount }, (_, index) => ({
    title: String(formData.get(`sectionTitle${index}`) ?? "").trim(),
    body: String(formData.get(`sectionBody${index}`) ?? "").trim(),
    example: String(formData.get(`sectionExample${index}`) ?? "").trim() || undefined,
  })).filter((item) => item.title && item.body);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Slug нь зөвхөн жижиг латин үсэг, тоо, зураастай байна." };
  if (allLessons.some((item) => item.id === slug)) return { error: "Энэ slug суурь хичээлд ашиглагдсан байна." };
  if (title.length < 3 || summary.length < 10 || !Number.isInteger(durationMinutes) || durationMinutes < 1) return { error: "Гарчиг, тайлбар болон хугацааг зөв бөглөнө үү." };
  if (!coreMathCourse.modules.some((item) => item.id === moduleId)) return { error: "Хичээл буруу байна." };
  if (!objectives.length || !sections.length) return { error: "Дор хаяж нэг зорилго, нэг агуулгын хэсэг нэмнэ үү." };

  return { title, slug, moduleId, summary, durationMinutes, sortOrder: Number.isInteger(sortOrder) ? sortOrder : 100, status, objectives, sections };
}

export async function createLesson(_: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };
  const parsed = parseLesson(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { data, error } = await supabase.from("course_lessons").insert({
    slug: parsed.slug,
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
  if (error?.code === "23505") return { error: "Энэ slug-тай хичээл аль хэдийн байна." };
  if (error || !data) return { error: error?.message || "Хичээл хадгалж чадсангүй." };
  revalidatePath("/admin/lessons");
  revalidatePath("/lesson");
  revalidatePath(`/lesson/${coreMathCourse.slug}`);
  return { id: data.id, success: parsed.status === "published" ? "Сэдэв нийтлэгдлээ." : "Draft сэдэв хадгалагдлаа." };
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
    slug: parsed.slug,
    module_id: parsed.moduleId,
    title: parsed.title,
    duration_minutes: parsed.durationMinutes,
    summary: parsed.summary,
    objectives: parsed.objectives,
    sections: parsed.sections,
    status: parsed.status,
    sort_order: parsed.sortOrder,
  }).eq("id", lessonId);
  if (error?.code === "23505") return { error: "Энэ slug-тай хичээл аль хэдийн байна." };
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
