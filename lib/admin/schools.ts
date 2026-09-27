import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function listAdminSchools() {
  const admin = createAdminClient();
  const [{ data: schools, error }, { data: accounts }, { data: teachers }, { data: students }, { data: classrooms }, usersResult] = await Promise.all([
    admin.from("schools").select("id, name, slug, is_active, created_at").order("name"),
    admin.from("profiles").select("id, full_name, school_id, created_at").eq("role", "school_admin"),
    admin.from("profiles").select("id, school_id").eq("role", "teacher"),
    admin.from("profiles").select("id, school_id").eq("role", "student").not("school_id", "is", null),
    admin.from("classrooms").select("id, school_id"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (error) throw new Error("Сургуулиудыг ачаалж чадсангүй.");
  const emails = new Map((usersResult.data?.users ?? []).map((user) => [user.id, user.email ?? "—"]));
  const accountMap = new Map<string, NonNullable<typeof accounts>>();
  const teacherCounts = new Map<string, number>();
  const studentCounts = new Map<string, number>();
  const classCounts = new Map<string, number>();
  for (const account of accounts ?? []) if (account.school_id) accountMap.set(account.school_id, [...(accountMap.get(account.school_id) ?? []), account]);
  for (const teacher of teachers ?? []) if (teacher.school_id) teacherCounts.set(teacher.school_id, (teacherCounts.get(teacher.school_id) ?? 0) + 1);
  for (const student of students ?? []) if (student.school_id) studentCounts.set(student.school_id, (studentCounts.get(student.school_id) ?? 0) + 1);
  for (const classroom of classrooms ?? []) classCounts.set(classroom.school_id, (classCounts.get(classroom.school_id) ?? 0) + 1);
  return (schools ?? []).map((school) => ({ ...school,
    accounts: (accountMap.get(school.id) ?? []).map((item) => ({ id: item.id, name: item.full_name || "Сургуулийн админ", email: emails.get(item.id) || "—", createdAt: item.created_at })),
    teacherCount: teacherCounts.get(school.id) ?? 0,
    studentCount: studentCounts.get(school.id) ?? 0,
    classCount: classCounts.get(school.id) ?? 0,
  }));
}
