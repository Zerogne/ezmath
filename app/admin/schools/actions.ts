"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } });
  if (error || !data.user) redirect(`/admin/schools?error=${error?.code === "email_exists" || error?.code === "user_already_exists" ? "exists" : "create"}`);
  const { error: profileError } = await admin.from("profiles").update({ role: "school_admin", school_id: schoolId }).eq("id", data.user.id);
  if (profileError) { await admin.auth.admin.deleteUser(data.user.id); redirect("/admin/schools?error=create"); }
  revalidatePath("/admin/schools");
  redirect("/admin/schools?created=1");
}
