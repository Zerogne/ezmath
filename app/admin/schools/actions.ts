"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SchoolCredentials = {
  schoolName: string;
  managerName: string;
  email: string;
  temporaryPassword: string;
  teacherCode: string;
};

export type SchoolFormState = {
  error?: string;
  success?: string;
  credentials?: SchoolCredentials;
};

function newTeacherCode() {
  const bytes = randomBytes(12);
  const value = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]);
  return `${value.slice(0, 4).join("")}-${value.slice(4, 8).join("")}-${value.slice(8, 12).join("")}`;
}

function newTeacherCredential() {
  const code = newTeacherCode();
  return { code, hash: createHash("sha256").update(code).digest("hex") };
}

function newTemporaryPassword() {
  return `Ez!${randomBytes(9).toString("base64url")}9a`;
}

function schoolSlug(name: string) {
  const transliteration: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
    и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", ө: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
    ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const latin = Array.from(name.toLocaleLowerCase("mn-MN"), (letter) => transliteration[letter] ?? letter).join("");
  return latin.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "school";
}

function uniqueSlug(base: string, attempt: number) {
  return attempt === 0 ? base : `${base}-${randomBytes(3).toString("hex")}`;
}

function authErrorMessage(code?: string) {
  if (code === "email_exists" || code === "user_already_exists") return "Энэ имэйлээр бүртгэл аль хэдийн байна.";
  if (code === "weak_password") return "Түр нууц үг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.";
  return "Удирдлагын нэвтрэх эрхийг үүсгэж чадсангүй. Дахин оролдоно уу.";
}

function readManager(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  };
}

async function requireAdmin() {
  const identity = await getAdminIdentity();
  return identity && identity.id !== "demo-admin";
}

async function attachManager(schoolId: string, fullName: string, email: string, temporaryPassword: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) return { error: authErrorMessage(error?.code) } as const;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({ role: "school_admin", school_id: schoolId })
    .eq("id", data.user.id)
    .select("id")
    .maybeSingle();

  if (profileError || !profile) {
    const { error: cleanupError } = await admin.auth.admin.deleteUser(data.user.id);
    if (cleanupError) console.error("Failed to clean up school manager user", { userId: data.user.id, code: cleanupError.code });
    return { error: "Удирдлагын профайлыг сургуультай холбож чадсангүй. Дахин оролдоно уу." } as const;
  }

  return { userId: data.user.id } as const;
}

async function removeSchool(schoolId: string) {
  const { error } = await createAdminClient().from("schools").delete().eq("id", schoolId);
  if (error) console.error("Failed to roll back school creation", { schoolId, code: error.code });
}

export async function createSchoolWithManager(_: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  if (!(await requireAdmin())) return { error: "Сургууль үүсгэхэд админ эрх болон Supabase холболт шаардлагатай." };

  const name = String(formData.get("name") ?? "").trim();
  const { fullName, email } = readManager(formData);
  if (name.length < 2 || name.length > 120) return { error: "Сургуулийн нэр 2–120 тэмдэгт байна." };
  if (fullName.length < 2 || fullName.length > 120) return { error: "Хариуцсан хүний нэрийг зөв оруулна уу." };
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: "Хүчинтэй нэвтрэх имэйл оруулна уу." };

  const admin = createAdminClient();
  const baseSlug = schoolSlug(name);
  let createdSchool: { id: string; slug: string; teacherCode: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { code, hash } = newTeacherCredential();
    const { data, error } = await admin
      .from("schools")
      .insert({ name, slug: uniqueSlug(baseSlug, attempt), registration_code_hash: hash, teacher_registration_code: code, is_active: true })
      .select("id, slug")
      .single();
    if (!error && data) {
      createdSchool = { ...data, teacherCode: code };
      break;
    }
    if (error?.code !== "23505") {
      console.error("Failed to create school", { code: error?.code });
      return { error: "Сургуулийн бүртгэл үүсгэж чадсангүй. Дахин оролдоно уу." };
    }
  }

  if (!createdSchool) return { error: "Сургуулийн давтагдашгүй бүртгэл үүсгэж чадсангүй. Дахин оролдоно уу." };

  const temporaryPassword = newTemporaryPassword();
  const manager = await attachManager(createdSchool.id, fullName, email, temporaryPassword);
  if ("error" in manager) {
    await removeSchool(createdSchool.id);
    return { error: manager.error };
  }

  revalidatePath("/admin/schools");
  revalidatePath("/register");
  return {
    success: `${name} сургууль болон удирдлагын эрх амжилттай үүслээ.`,
    credentials: { schoolName: name, managerName: fullName, email, temporaryPassword, teacherCode: createdSchool.teacherCode },
  };
}

export async function createSchoolAccount(_: SchoolFormState, formData: FormData): Promise<SchoolFormState> {
  if (!(await requireAdmin())) return { error: "Аккаунт үүсгэхэд админ эрх болон Supabase холболт шаардлагатай." };

  const { fullName, email } = readManager(formData);
  const schoolId = String(formData.get("schoolId") ?? "");
  if (fullName.length < 2 || fullName.length > 120) return { error: "Хариуцсан хүний нэрийг зөв оруулна уу." };
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: "Хүчинтэй нэвтрэх имэйл оруулна уу." };
  if (!schoolId) return { error: "Сургуулиа сонгоно уу." };

  const admin = createAdminClient();
  const { data: school, error: schoolError } = await admin
    .from("schools")
    .select("id, name, teacher_registration_code")
    .eq("id", schoolId)
    .eq("is_active", true)
    .maybeSingle();
  if (schoolError || !school) return { error: "Идэвхтэй сургууль олдсонгүй." };

  const temporaryPassword = newTemporaryPassword();
  const manager = await attachManager(school.id, fullName, email, temporaryPassword);
  if ("error" in manager) return { error: manager.error };

  revalidatePath("/admin/schools");
  return {
    success: `${school.name}-д удирдлагын эрх нэмэгдлээ.`,
    credentials: { schoolName: school.name, managerName: fullName, email, temporaryPassword, teacherCode: school.teacher_registration_code ?? "—" },
  };
}
