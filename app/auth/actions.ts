"use server";

import { redirect } from "next/navigation";
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
  redirect(next ?? (profile?.role === "admin" ? "/admin" : "/dashboard"));
}

export async function signUp(_state: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase тохируулагдаагүй байна. Environment variables-аа нэмнэ үү." };
  const { email, password, fullName, next } = credentials(formData);
  if (!email || !fullName || password.length < 8) return { error: "Нэр, зөв имэйл болон 8-аас дээш тэмдэгттэй нууц үг оруулна уу." };
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) return { error: signUpErrorMessage(error?.code) };
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Бүртгэл үүссэн ч нэвтрүүлж чадсангүй. Дахин оролдоно уу." };
  }
  redirect(next ?? "/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured()) { const supabase = await createClient(); await supabase.auth.signOut(); }
  redirect("/");
}
