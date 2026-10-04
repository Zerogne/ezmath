"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSchoolAdmin } from "@/lib/data/school-dashboard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeacherVerificationStatus } from "@/lib/supabase/database.types";
import { createClient as createStandaloneClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type PasswordFormState = { error?: string; success?: string };

const MIN_PASSWORD_LENGTH = 8;

export async function changeSchoolAdminPassword(_: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const { user } = await requireSchoolAdmin("/school/settings");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword) return { error: "Одоогийн нууц үгээ оруулна уу." };
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { error: `Шинэ нууц үг дор хаяж ${MIN_PASSWORD_LENGTH} тэмдэгт байна.` };
  if (newPassword.length > 72) return { error: "Шинэ нууц үг 72 тэмдэгтээс хэтрэхгүй." };
  if (!/[A-Za-zА-Яа-яӨөҮүЁё]/.test(newPassword) || !/\d/.test(newPassword)) return { error: "Шинэ нууц үгэнд үсэг болон тоо хоёулаа орсон байх ёстой." };
  if (newPassword !== confirmPassword) return { error: "Шинэ нууц үг таарахгүй байна." };
  if (newPassword === currentPassword) return { error: "Шинэ нууц үг одоогийнхоос өөр байх ёстой." };
  if (!user.email) return { error: "Бүртгэлийн имэйл олдсонгүй." };

  // Verify the current password on a throwaway client so the admin's own session cookies are untouched.
  const { url, anonKey } = getSupabaseConfig();
  const verifier = createStandaloneClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error: verifyError } = await verifier.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verifyError) return { error: verifyError.code === "over_request_rate_limit" ? "Хэт олон оролдлого хийлээ. Түр хүлээгээд дахин оролдоно уу." : "Одоогийн нууц үг буруу байна." };

  // The admin API sets the password without Supabase's recent-login reauthentication requirement;
  // the current password was just verified above.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    user_metadata: { ...user.user_metadata, password_temporary: false },
  });
  if (error) return { error: error.code === "weak_password" ? "Нууц үг хэт сул байна. Илүү урт, олон төрлийн тэмдэгт ашиглана уу." : "Нууц үг солиход алдаа гарлаа. Дахин оролдоно уу." };

  revalidatePath("/school", "layout");
  return { success: "Нууц үг амжилттай солигдлоо." };
}

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
