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
  return (schools ?? []).map((school) => ({ ...school,
    accounts: (accounts ?? []).filter((item) => item.school_id === school.id).map((item) => ({ id: item.id, name: item.full_name || "Сургуулийн админ", email: emails.get(item.id) || "—", createdAt: item.created_at })),
    teacherCount: (teachers ?? []).filter((item) => item.school_id === school.id).length,
    studentCount: (students ?? []).filter((item) => item.school_id === school.id).length,
    classCount: (classrooms ?? []).filter((item) => item.school_id === school.id).length,
  }));
}
