"use server";
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newTeacherCode() {
  const bytes = randomBytes(12);
  const value = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]);
  return `${value.slice(0, 4).join("")}-${value.slice(4, 8).join("")}-${value.slice(8, 12).join("")}`;
}

function newTeacherCredential() {
  const code = newTeacherCode();
  return { code, hash: createHash("sha256").update(code).digest("hex") };
}

async function ensureTeacherCode(schoolId: string) {
  const admin = createAdminClient();
  const { data: existing, error: readError } = await admin
    .from("schools")
    .select("teacher_registration_code")
    .eq("id", schoolId)
    .single();
  if (readError) throw readError;
  if (existing.teacher_registration_code) return;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { code, hash: registrationCodeHash } = newTeacherCredential();
    const { data, error } = await admin
      .from("schools")
      .update({ teacher_registration_code: code, registration_code_hash: registrationCodeHash })
      .eq("id", schoolId)
      .is("teacher_registration_code", null)
      .select("id")
      .maybeSingle();
    if (data) return;
    if (!error) return;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Could not generate a unique teacher verification code.");
}

export async function createSchool(formData: FormData) {
  const adminIdentity = await getAdminIdentity();
  if (!adminIdentity) redirect("/login?next=/admin/schools&reason=admin");

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 120 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    redirect("/admin/schools?error=school-invalid");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin.from("schools").select("id").eq("slug", slug).maybeSingle();
  if (existing) redirect("/admin/schools?error=school-exists");

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { code, hash } = newTeacherCredential();
    const { error } = await admin.from("schools").insert({
      name,
      slug,
      registration_code_hash: hash,
      teacher_registration_code: code,
      is_active: true,
    });
    if (!error) {
      revalidatePath("/admin/schools");
      revalidatePath("/register");
      redirect("/admin/schools?schoolCreated=1");
    }
    if (error.code !== "23505") redirect("/admin/schools?error=school-create");
    const { data: duplicateSlug } = await admin.from("schools").select("id").eq("slug", slug).maybeSingle();
    if (duplicateSlug) redirect("/admin/schools?error=school-exists");
  }
  redirect("/admin/schools?error=school-create");
}

export async function createSchoolAccount(formData: FormData) {
  const adminIdentity = await getAdminIdentity();
  if (!adminIdentity) redirect("/login?next=/admin/schools&reason=admin");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const schoolId = String(formData.get("schoolId") ?? "");
  if (fullName.length < 2 || !email.includes("@") || password.length < 12 || !schoolId) redirect("/admin/schools?error=invalid");
  const admin = createAdminClient();
  const { data: school } = await admin.from("schools").select("id").eq("id", schoolId).eq("is_active", true).maybeSingle();
  if (!school) redirect("/admin/schools?error=school");
  try {
    await ensureTeacherCode(school.id);
  } catch {
    redirect("/admin/schools?error=create");
  }
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error || !data.user) redirect(`/admin/schools?error=${error?.code === "email_exists" || error?.code === "user_already_exists" ? "exists" : "create"}`);
  const { error: profileError } = await admin.from("profiles").update({ role: "school_admin", school_id: schoolId }).eq("id", data.user.id);
  if (profileError) { await admin.auth.admin.deleteUser(data.user.id); redirect("/admin/schools?error=create"); }
  revalidatePath("/admin/schools");
  redirect("/admin/schools?created=1");
}
