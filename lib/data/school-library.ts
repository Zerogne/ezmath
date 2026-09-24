import "server-only";

import { redirect } from "next/navigation";
import { parseChoices } from "@/lib/class-exams/choices";
import { requireApprovedTeacher } from "@/lib/data/classrooms";
import { requireSchoolAdmin } from "@/lib/data/school-dashboard";
import { createClient } from "@/lib/supabase/server";
import type { SchoolLibraryAnswerType } from "@/lib/supabase/database.types";

export type LibraryChoice = { label: string; text: string };
export type LibraryMaterial = {
  id: string;
  schoolId: string;
  createdBy: string | null;
  title: string;
  topic: string;
  questionLatex: string;
  answerType: SchoolLibraryAnswerType;
  answerKey: string;
  choices: LibraryChoice[];
  createdAt: string;
  updatedAt: string;
};

async function loadLibrary(schoolId: string, currentUserId: string, role: "teacher" | "school_admin", accountName: string) {
  const supabase = await createClient();
  const [{ data: school }, { data: rows, error }] = await Promise.all([
    supabase.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    supabase
      .from("school_library_materials")
      .select("id, school_id, created_by, title, topic, question_latex, answer_type, answer_key, choices, created_at, updated_at")
      .eq("school_id", schoolId)
      .order("updated_at", { ascending: false }),
  ]);

  if (error) throw new Error("Сургуулийн бодлогын санг ачаалж чадсангүй.");
  const materials: LibraryMaterial[] = (rows ?? []).map((row) => ({
    id: row.id,
    schoolId: row.school_id,
    createdBy: row.created_by,
    title: row.title,
    topic: row.topic,
    questionLatex: row.question_latex,
    answerType: row.answer_type,
    answerKey: row.answer_key,
    choices: parseChoices(row.choices),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return {
    accountName,
    schoolName: school?.name || "Сургууль",
    currentUserId,
    canManageAll: role === "school_admin",
    materials,
  };
}

export async function getTeacherLibrary() {
  const { user, profile } = await requireApprovedTeacher("/teacher/library");
  if (!profile.school_id) redirect("/teacher");
  return loadLibrary(profile.school_id, user.id, "teacher", profile.full_name || "Багш");
}

export async function getSchoolAdminLibrary() {
  const { user, profile, schoolId } = await requireSchoolAdmin("/school/library");
  return loadLibrary(schoolId, user.id, "school_admin", profile.full_name || "Сургуулийн админ");
}
