"use server";

import { redirect } from "next/navigation";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthState = { error?: string; success?: string };

function signUpErrorMessage(code?: string) {
  switch (code) {
    case "email_address_invalid":
      return "Хүчинтэй, бодит имэйл хаяг оруулна уу.";
    case "email_exists":
    case "user_already_exists":
      return "Энэ имэйлээр бүртгэл аль хэдийн үүссэн байна. Нэвтрэх хэсгийг ашиглана уу.";
    case "weak_password":
      return "Нууц үг хангалтгүй байна. Илүү урт, таахад хэцүү нууц үг ашиглана уу.";
    case "signup_disabled":
      return "Шинээр бүртгүүлэх үйлдэл одоогоор хаалттай байна.";
    default:
      return "Бүртгэл үүсгэж чадсангүй. Мэдээллээ шалгаад дахин оролдоно уу.";
  }
}

function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
    next: safeNext(String(formData.get("next") ?? "")),
    role: String(formData.get("role") ?? "student") === "teacher" ? "teacher" as const : "student" as const,
    schoolSlug: String(formData.get("school") ?? ""),
    schoolCode: String(formData.get("schoolCode") ?? "").trim().toUpperCase(),
  };
}

function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

export async function signIn(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase тохируулагдаагүй байна. Environment variables-аа нэмнэ үү." };
  const { email, password, next } = credentials(formData);
  if (!email || !password) return { error: "Имэйл болон нууц үгээ оруулна уу." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Имэйл эсвэл нууц үг буруу байна." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  redirect(next ?? (profile?.role === "admin" ? "/admin" : profile?.role === "school_admin" ? "/school" : profile?.role === "teacher" ? "/teacher" : "/dashboard"));
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase тохируулагдаагүй байна. Environment variables-аа нэмнэ үү." };
  const { email, password, fullName, next, role, schoolSlug, schoolCode } = credentials(formData);
  if (!email || !fullName || password.length < 8) return { error: "Нэр, зөв имэйл болон 8-аас дээш тэмдэгттэй нууц үг оруулна уу." };
  if (role === "teacher" && !schoolSlug) return { error: "Сургуулиа сонгоно уу." };
  const admin = createAdminClient();
  let schoolId: string | null = null;
  if (role === "teacher") {
    const { data: school } = await admin.from("schools").select("id, registration_code_hash").eq("slug", schoolSlug).eq("is_active", true).maybeSingle();
    const supplied = createHash("sha256").update(schoolCode).digest();
    const expected = school?.registration_code_hash ? Buffer.from(school.registration_code_hash, "hex") : Buffer.alloc(32);
    if (expected.length !== supplied.length || !timingSafeEqual(supplied, expected)) return { error: "Сургуулийн код буруу байна." };
    schoolId = school?.id ?? null;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) return { error: signUpErrorMessage(error?.code) };
  if (role === "teacher") {
    const { error: profileError } = await admin.from("profiles").update({ role: "teacher", school_id: schoolId }).eq("id", data.user.id);
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return { error: "Багшийн эрхийг тохируулж чадсангүй. Дахин оролдоно уу." };
    }
  }
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Бүртгэл үүссэн ч нэвтрүүлж чадсангүй. Дахин оролдоно уу." };
  }
  redirect(next ?? (role === "teacher" ? "/teacher" : "/dashboard"));
}

export async function signOut() {
  if (isSupabaseConfigured()) { const supabase = await createClient(); await supabase.auth.signOut(); }
  redirect("/");
}
