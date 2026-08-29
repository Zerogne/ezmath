import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getSchoolDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/school");
  const { data: profile } = await supabase.from("profiles").select("full_name, role, school_id").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role !== "school_admin" || !profile.school_id) redirect("/dashboard");
  const admin = createAdminClient();
  const [{ data: school }, { data: people }, { data: classes }, { data: memberships }] = await Promise.all([
    admin.from("schools").select("id, name, teacher_registration_code").eq("id", profile.school_id).single(),
    admin.from("profiles").select("id, full_name, role, created_at").eq("school_id", profile.school_id),
    admin.from("classrooms").select("id, name, code, teacher_id, created_at").eq("school_id", profile.school_id).order("created_at", { ascending: false }),
    admin.from("classroom_students").select("classroom_id, student_id, joined_at"),
  ]);
  const students = (people ?? []).filter((item) => item.role === "student");
  const teachers = (people ?? []).filter((item) => item.role === "teacher");
  const studentIds = students.map((item) => item.id);
  const [{ data: attempts }, { data: lessons }] = await Promise.all([
    studentIds.length ? admin.from("test_attempts").select("id, user_id, status, completed_at").in("user_id", studentIds).eq("status", "submitted") : Promise.resolve({ data: [] }),
    studentIds.length ? admin.from("student_lesson_progress").select("user_id, completed_at, last_opened_at").in("user_id", studentIds) : Promise.resolve({ data: [] }),
  ]);
  const names = new Map((people ?? []).map((item) => [item.id, item.full_name || (item.role === "teacher" ? "Багш" : "Сурагч")]));
  return {
    accountName: profile.full_name || "Сургуулийн админ",
    schoolName: school?.name || "Сургууль",
    teacherCode: school?.teacher_registration_code ?? null,
    teacherCount: teachers.length,
    studentCount: students.length,
    classCount: classes?.length ?? 0,
    completedAttempts: attempts?.length ?? 0,
    completedLessons: (lessons ?? []).filter((item) => item.completed_at).length,
    classes: (classes ?? []).map((item) => ({
      ...item,
      teacherName: names.get(item.teacher_id) || "Багш",
      studentCount: (memberships ?? []).filter((membership) => membership.classroom_id === item.id).length,
    })),
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      name: names.get(teacher.id)!,
      classes: (classes ?? []).filter((item) => item.teacher_id === teacher.id).length,
      students: new Set(
        (memberships ?? [])
          .filter((membership) => (classes ?? []).some((item) => item.id === membership.classroom_id && item.teacher_id === teacher.id))
          .map((item) => item.student_id),
      ).size,
    })),
  };
}
