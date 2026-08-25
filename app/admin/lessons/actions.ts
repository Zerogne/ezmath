"use server";

import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/auth";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { allLessons } from "@/lib/learning/course-catalog";
import { createClient } from "@/lib/supabase/server";

export type LessonFormState = { error?: string; success?: string };

export async function createLesson(_: LessonFormState, formData: FormData): Promise<LessonFormState> {
  const admin = await getAdminIdentity();
  if (!admin || admin.id === "demo-admin") return { error: "Админ эрх болон Supabase холболт шаардлагатай." };

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const moduleId = String(formData.get("moduleId") ?? "");
  const summary = String(formData.get("summary") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  const sortOrder = Number(formData.get("sortOrder"));
  const status = formData.get("status") === "published" ? "published" as const : "draft" as const;
  const objectives = String(formData.get("objectives") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
  const sections = [1, 2, 3].map((index) => ({
    title: String(formData.get(`sectionTitle${index}`) ?? "").trim(),
    body: String(formData.get(`sectionBody${index}`) ?? "").trim(),
    example: String(formData.get(`sectionExample${index}`) ?? "").trim() || undefined,
  })).filter((item) => item.title && item.body);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Slug нь зөвхөн жижиг латин үсэг, тоо, зураастай байна." };
  if (allLessons.some((item) => item.id === slug)) return { error: "Энэ slug суурь хичээлд ашиглагдсан байна." };
  if (title.length < 3 || summary.length < 10 || !Number.isInteger(durationMinutes) || durationMinutes < 1) return { error: "Гарчиг, тайлбар болон хугацааг зөв бөглөнө үү." };
  if (!coreMathCourse.modules.some((item) => item.id === moduleId)) return { error: "Модуль буруу байна." };
  if (!objectives.length || !sections.length) return { error: "Дор хаяж нэг зорилго, нэг агуулгын хэсэг нэмнэ үү." };

  const supabase = await createClient();
  const { error } = await supabase.from("course_lessons").insert({
    slug,
    course_slug: coreMathCourse.slug,
    module_id: moduleId,
    title,
    duration_minutes: durationMinutes,
    summary,
    objectives,
    sections,
    status,
    sort_order: Number.isInteger(sortOrder) ? sortOrder : 100,
    created_by: admin.id,
  });
  if (error?.code === "23505") return { error: "Энэ slug-тай хичээл аль хэдийн байна." };
  if (error) return { error: error.message || "Хичээл хадгалж чадсангүй." };
  revalidatePath("/admin/lessons");
  revalidatePath("/lesson");
  revalidatePath(`/lesson/${coreMathCourse.slug}`);
  return { success: status === "published" ? "Хичээл нийтлэгдлээ." : "Draft хичээл хадгалагдлаа." };
}
