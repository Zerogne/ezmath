"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireApprovedTeacher } from "@/lib/data/classrooms";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() { return [...randomBytes(7)].map((byte) => alphabet[byte % alphabet.length]).join(""); }

export async function createClass(formData: FormData) {
  const { user, profile } = await requireApprovedTeacher();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) redirect("/teacher?error=invalid-name");
  const admin = createAdminClient();
  if (!profile?.school_id) redirect("/teacher?error=school-required");
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await admin.from("classrooms").insert({ teacher_id: user.id, school_id: profile.school_id, name, code: newCode() }).select("id").single();
    if (data) { revalidatePath("/teacher"); redirect(`/teacher/classes/${data.id}?created=1`); }
    if (error?.code !== "23505") redirect("/teacher?error=create-failed");
  }
  redirect("/teacher?error=code-failed");
}
