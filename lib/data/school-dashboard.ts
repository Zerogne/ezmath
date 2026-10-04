import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeacherVerificationStatus } from "@/lib/supabase/database.types";

export async function requireSchoolAdmin(nextPath = "/school") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const { data: profile } = await supabase.from("profiles").select("full_name, role, school_id").eq("id", user.id).maybeSingle();
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role !== "school_admin" || !profile.school_id) redirect("/dashboard");
  return { user, profile, schoolId: profile.school_id };
}

export async function getSchoolDashboard() {
  const { user, profile, schoolId } = await requireSchoolAdmin();
  const admin = createAdminClient();
  const [schoolResult, peopleResult, classesResult] = await Promise.all([
    admin.from("schools").select("id, name, teacher_registration_code").eq("id", schoolId).single(),
    admin.from("profiles").select("id, full_name, role, teacher_status, created_at").eq("school_id", schoolId),
    admin.from("classrooms").select("id, name, code, teacher_id, created_at").eq("school_id", schoolId).order("created_at", { ascending: false }),
  ]);
  if (schoolResult.error || peopleResult.error || classesResult.error) throw new Error("Сургуулийн мэдээллийг ачаалж чадсангүй.");
  const school = schoolResult.data;
  const people = peopleResult.data ?? [];
  const classes = classesResult.data ?? [];
  const classIds = classes.map((item) => item.id);
  const { data: memberships, error: membershipError } = classIds.length
    ? await admin.from("classroom_students").select("classroom_id, student_id, joined_at").in("classroom_id", classIds)
    : { data: [], error: null };
  if (membershipError) throw new Error("Сургуулийн ангийн мэдээллийг ачаалж чадсангүй.");
  const students = people.filter((item) => item.role === "student");
  const teachers = people.filter((item) => item.role === "teacher");
  const studentIds = students.map((item) => item.id);
  const [{ data: attempts }, { data: lessons }] = await Promise.all([
    studentIds.length ? admin.from("test_attempts").select("id, user_id, status, completed_at").in("user_id", studentIds).eq("status", "submitted") : Promise.resolve({ data: [] }),
    studentIds.length ? admin.from("student_lesson_progress").select("user_id, completed_at, last_opened_at").in("user_id", studentIds) : Promise.resolve({ data: [] }),
  ]);
  const names = new Map(people.map((item) => [item.id, item.full_name || (item.role === "teacher" ? "Багш" : "Сурагч")]));
  return {
    accountName: profile.full_name || "Сургуулийн админ",
    schoolName: school?.name || "Сургууль",
    mustChangePassword: user.user_metadata?.password_temporary === true,
    teacherCode: school?.teacher_registration_code ?? null,
    teacherCount: teachers.filter((teacher) => teacher.teacher_status === "approved").length,
    pendingTeacherCount: teachers.filter((teacher) => teacher.teacher_status === "pending").length,
    studentCount: students.length,
    classCount: classes.length,
    completedAttempts: attempts?.length ?? 0,
    completedLessons: (lessons ?? []).filter((item) => item.completed_at).length,
    classes: classes.map((item) => ({
      ...item,
      teacherName: names.get(item.teacher_id) || "Багш",
      studentCount: (memberships ?? []).filter((membership) => membership.classroom_id === item.id).length,
    })),
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      name: names.get(teacher.id)!,
      status: (teacher.teacher_status ?? "pending") as TeacherVerificationStatus,
      createdAt: teacher.created_at,
      classes: classes.filter((item) => item.teacher_id === teacher.id).length,
      students: new Set(
        (memberships ?? [])
          .filter((membership) => classes.some((item) => item.id === membership.classroom_id && item.teacher_id === teacher.id))
          .map((item) => item.student_id),
      ).size,
    })),
    pendingTeachers: teachers
      .filter((teacher) => teacher.teacher_status === "pending")
      .map((teacher) => ({ id: teacher.id, name: names.get(teacher.id)!, createdAt: teacher.created_at })),
  };
}
