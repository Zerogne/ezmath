"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/data/school-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeacherVerificationStatus } from "@/lib/supabase/database.types";

export async function reviewTeacher(formData: FormData) {
  const teacherId = String(formData.get("teacherId") ?? "");
  const requestedStatus = String(formData.get("status") ?? "");
  if (!teacherId || (requestedStatus !== "approved" && requestedStatus !== "rejected")) {
    redirect("/school?error=invalid-review");
  }

  const { schoolId } = await requireSchoolAdmin("/school");
  const admin = createAdminClient();
  const status = requestedStatus as TeacherVerificationStatus;
  const { data, error } = await admin
    .from("profiles")
    .update({ teacher_status: status })
    .eq("id", teacherId)
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/school?error=review-failed");

  revalidatePath("/school");
  revalidatePath("/teacher");
  redirect(`/school?teacherUpdated=${status}`);
}
