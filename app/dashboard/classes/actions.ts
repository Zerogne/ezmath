"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStudent } from "@/lib/data/classrooms";

export async function joinClass(formData: FormData) {
  const { user } = await requireStudent();
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 6) redirect("/dashboard/classes?error=invalid-code");
  const admin = createAdminClient();
  const { data: classroom } = await admin.from("classrooms").select("id, school_id").eq("code", code).maybeSingle();
  if (!classroom) redirect("/dashboard/classes?error=not-found");
  const { data: profile } = await admin.from("profiles").select("school_id").eq("id", user.id).maybeSingle();
  if (profile?.school_id && profile.school_id !== classroom.school_id) redirect("/dashboard/classes?error=wrong-school");
  if (!profile?.school_id) {
    const { error: schoolError } = await admin.from("profiles").update({ school_id: classroom.school_id }).eq("id", user.id).eq("role", "student");
    if (schoolError) redirect("/dashboard/classes?error=join-failed");
  }
  const { error } = await admin.from("classroom_students").upsert({ classroom_id: classroom.id, student_id: user.id }, { onConflict: "classroom_id,student_id", ignoreDuplicates: true });
  if (error) redirect("/dashboard/classes?error=join-failed");
  revalidatePath("/dashboard/classes");
  redirect("/dashboard/classes?joined=1");
}

export async function leaveClass(formData: FormData) {
  const { user } = await requireStudent();
  const classroomId = String(formData.get("classroomId") ?? "");
  await createAdminClient().from("classroom_students").delete().eq("classroom_id", classroomId).eq("student_id", user.id);
  revalidatePath("/dashboard/classes");
}
