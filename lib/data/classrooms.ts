import "server-only";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TeacherVerificationStatus } from "@/lib/supabase/database.types";

async function currentUser(expectedRole: "student" | "teacher", nextPath: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, school_id, teacher_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "school_admin") redirect("/school");
  if (profile?.role !== expectedRole) redirect(expectedRole === "teacher" ? "/dashboard" : "/teacher");
  return { user, profile };
}

export async function requireTeacher(nextPath = "/teacher") { return currentUser("teacher", nextPath); }
export async function requireApprovedTeacher(nextPath = "/teacher") {
  const identity = await requireTeacher(nextPath);
  if (identity.profile.teacher_status !== "approved") redirect("/teacher");
  return identity;
}
export async function requireStudent(nextPath = "/dashboard/classes") { return currentUser("student", nextPath); }

export async function getStudentClasses() {
  const { user } = await requireStudent();
  const admin = createAdminClient();
  const { data: memberships, error } = await admin.from("classroom_students").select("classroom_id, joined_at").eq("student_id", user.id).order("joined_at", { ascending: false });
  if (error) throw new Error("Ангийн мэдээллийг ачаалж чадсангүй.");
  const ids = (memberships ?? []).map((item) => item.classroom_id);
  if (!ids.length) return [];
  const { data: classes } = await admin.from("classrooms").select("id, name, code, teacher_id").in("id", ids);
  const teacherIds = [...new Set((classes ?? []).map((item) => item.teacher_id))];
  const { data: teachers } = teacherIds.length ? await admin.from("profiles").select("id, full_name").in("id", teacherIds) : { data: [] };
  const names = new Map((teachers ?? []).map((item) => [item.id, item.full_name]));
  const joined = new Map((memberships ?? []).map((item) => [item.classroom_id, item.joined_at]));
  return (classes ?? []).map((item) => ({ ...item, teacherName: names.get(item.teacher_id) || "Багш", joinedAt: joined.get(item.id)! }));
}

export async function getTeacherOverview(classroomId?: string) {
  const { user, profile } = await requireTeacher(classroomId ? `/teacher/classes/${classroomId}` : "/teacher");
  const admin = createAdminClient();
  const { data: school } = profile?.school_id ? await admin.from("schools").select("name").eq("id", profile.school_id).maybeSingle() : { data: null };
  const verificationStatus = (profile.teacher_status ?? "pending") as TeacherVerificationStatus;
  if (verificationStatus !== "approved") {
    return {
      teacherName: profile.full_name || "Багш",
      schoolName: school?.name || "Сургууль",
      verificationStatus,
      classes: [],
      selected: null,
      students: [],
    };
  }
  const { data: classes, error } = await admin.from("classrooms").select("id, name, code, created_at").eq("teacher_id", user.id).order("created_at", { ascending: false });
  if (error) throw new Error("Ангиудыг ачаалж чадсангүй.");
  const selected = classroomId ? classes?.find((item) => item.id === classroomId) : undefined;
  if (classroomId && !selected) return { teacherName: profile?.full_name || "Багш", schoolName: school?.name || "Amjilt Cyber", verificationStatus, classes: classes ?? [], selected: null, students: [] };
  const classIds = selected ? [selected.id] : (classes ?? []).map((item) => item.id);
  const { data: memberships } = classIds.length ? await admin.from("classroom_students").select("classroom_id, student_id, joined_at").in("classroom_id", classIds) : { data: [] };
  const studentIds = [...new Set((memberships ?? []).map((item) => item.student_id))];
  const [{ data: profiles }, { data: attempts }, { data: lessons }] = await Promise.all([
    studentIds.length ? admin.from("profiles").select("id, full_name, avatar_url").in("id", studentIds) : Promise.resolve({ data: [] }),
    studentIds.length ? admin.from("test_attempts").select("id, user_id, test_id, score, status, completed_at, duration_seconds").in("user_id", studentIds).order("completed_at", { ascending: false }) : Promise.resolve({ data: [] }),
    studentIds.length ? admin.from("student_lesson_progress").select("user_id, lesson_id, completed_at, last_opened_at").in("user_id", studentIds) : Promise.resolve({ data: [] }),
  ]);
  const testIds = [...new Set((attempts ?? []).map((item) => item.test_id))];
  const attemptIds = (attempts ?? []).map((item) => item.id);
  const [{ data: tests }, { data: answers }, { data: integrityEvents }] = await Promise.all([
    testIds.length ? admin.from("tests").select("id, title, exam_type, subject").in("id", testIds) : Promise.resolve({ data: [] }),
    attemptIds.length ? admin.from("attempt_answers").select("attempt_id, is_correct").in("attempt_id", attemptIds) : Promise.resolve({ data: [] }),
    attemptIds.length ? admin.from("test_integrity_events").select("attempt_id, event_type, occurred_at").in("attempt_id", attemptIds).order("occurred_at") : Promise.resolve({ data: [] }),
  ]);
  const testsById = new Map((tests ?? []).map((item) => [item.id, item]));
  const answerTotals = new Map<string, { correct: number; total: number }>();
  for (const answer of answers ?? []) { const total = answerTotals.get(answer.attempt_id) ?? { correct: 0, total: 0 }; total.total++; if (answer.is_correct) total.correct++; answerTotals.set(answer.attempt_id, total); }
  const integrityByAttempt = new Map<string, { eventType: string; occurredAt: string }[]>();
  for (const event of integrityEvents ?? []) integrityByAttempt.set(event.attempt_id, [...(integrityByAttempt.get(event.attempt_id) ?? []), { eventType: event.event_type, occurredAt: event.occurred_at }]);
  const profilesById = new Map((profiles ?? []).map((item) => [item.id, item]));
  const students = studentIds.map((id) => {
    const allStudentAttempts = (attempts ?? []).filter((item) => item.user_id === id);
    const studentAttempts = allStudentAttempts.filter((item) => item.status === "submitted");
    const studentLessons = (lessons ?? []).filter((item) => item.user_id === id);
    const correct = studentAttempts.reduce((sum, item) => sum + (answerTotals.get(item.id)?.correct ?? 0), 0);
    const total = studentAttempts.reduce((sum, item) => sum + (answerTotals.get(item.id)?.total ?? 0), 0);
    const latestTimes = [...studentAttempts.map((item) => item.completed_at), ...studentLessons.map((item) => item.last_opened_at)].filter(Boolean).map(String).sort();
    const studentIntegrityEvents = allStudentAttempts.reduce((sum, item) => sum + (integrityByAttempt.get(item.id)?.length ?? 0), 0);
    return { id, name: profilesById.get(id)?.full_name || "Нэргүй сурагч", avatarUrl: profilesById.get(id)?.avatar_url ?? null, classIds: (memberships ?? []).filter((item) => item.student_id === id).map((item) => item.classroom_id), joinedAt: (memberships ?? []).find((item) => item.student_id === id)?.joined_at ?? "", completedLessons: studentLessons.filter((item) => item.completed_at).length, openedLessons: studentLessons.length, attempts: studentAttempts.length, accuracy: total ? Math.round(correct / total * 100) : 0, latestActivity: latestTimes.at(-1) ?? null, integrityEvents: studentIntegrityEvents, flaggedAttempts: allStudentAttempts.filter((item) => (integrityByAttempt.get(item.id)?.length ?? 0) > 0).length, integrityAlerts: allStudentAttempts.filter((item) => (integrityByAttempt.get(item.id)?.length ?? 0) > 0).map((item) => ({ attemptId: item.id, status: item.status, test: testsById.get(item.test_id), events: integrityByAttempt.get(item.id) ?? [] })), history: studentAttempts.map((item) => ({ ...item, test: testsById.get(item.test_id), answers: answerTotals.get(item.id) ?? { correct: 0, total: 0 }, integrityEvents: integrityByAttempt.get(item.id) ?? [] })) };
  });
  return { teacherName: profile?.full_name || "Багш", schoolName: school?.name || "Amjilt Cyber", verificationStatus, classes: classes ?? [], selected: selected ?? null, students };
}
