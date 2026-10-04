import "server-only";

import { notFound, redirect } from "next/navigation";
import { parseChoices } from "@/lib/class-exams/choices";
import { requireApprovedTeacher } from "@/lib/data/classrooms";
import { requireSchoolAdmin } from "@/lib/data/school-dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Json, SchoolLibraryAnswerType } from "@/lib/supabase/database.types";

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
/** A whole material (e.g. one ЭЕШ variant): ordered problems sharing a title/subject. */
export type LibraryCollectionSummary = {
  id: string;
  createdBy: string | null;
  title: string;
  subject: string;
  year: number | null;
  variant: string | null;
  description: string;
  problemCount: number;
  updatedAt: string;
};
export type LibraryCollection = Omit<LibraryCollectionSummary, "problemCount"> & { problems: LibraryMaterial[] };
export type LibraryRole = "teacher" | "school_admin";

const materialColumns = "id, school_id, created_by, title, topic, question_latex, answer_type, answer_key, choices, created_at, updated_at";
type MaterialRow = { id: string; school_id: string; created_by: string | null; title: string; topic: string; question_latex: string; answer_type: SchoolLibraryAnswerType; answer_key: string; choices: Json; created_at: string; updated_at: string };

function toMaterial(row: MaterialRow): LibraryMaterial {
  return {
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
  };
}

async function libraryIdentity(role: LibraryRole, nextPath: string) {
  if (role === "school_admin") {
    const { user, profile, schoolId } = await requireSchoolAdmin(nextPath);
    return { userId: user.id, schoolId, accountName: profile.full_name || "Сургуулийн админ" };
  }
  const { user, profile } = await requireApprovedTeacher(nextPath);
  if (!profile.school_id) redirect("/teacher");
  return { userId: user.id, schoolId: profile.school_id, accountName: profile.full_name || "Багш" };
}

export async function getLibrary(role: LibraryRole) {
  const { userId, schoolId, accountName } = await libraryIdentity(role, role === "teacher" ? "/teacher/library" : "/school/library");
  const supabase = await createClient();
  const [{ data: school }, { data: rows, error }, { data: collectionRows, error: collectionError }, { data: memberships }] = await Promise.all([
    supabase.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    supabase.from("school_library_materials").select(materialColumns).eq("school_id", schoolId).is("collection_id", null).order("updated_at", { ascending: false }),
    supabase.from("school_library_collections").select("id, created_by, title, subject, year, variant, description, updated_at").eq("school_id", schoolId).order("updated_at", { ascending: false }),
    supabase.from("school_library_materials").select("collection_id").eq("school_id", schoolId).not("collection_id", "is", null),
  ]);
  if (error || collectionError) throw new Error("Сургуулийн бодлогын санг ачаалж чадсангүй.");

  const counts = new Map<string, number>();
  for (const row of memberships ?? []) if (row.collection_id) counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
  const collections: LibraryCollectionSummary[] = (collectionRows ?? []).map((row) => ({
    id: row.id,
    createdBy: row.created_by,
    title: row.title,
    subject: row.subject,
    year: row.year,
    variant: row.variant,
    description: row.description,
    problemCount: counts.get(row.id) ?? 0,
    updatedAt: row.updated_at,
  }));

  return {
    accountName,
    schoolName: school?.name || "Сургууль",
    currentUserId: userId,
    canManageAll: role === "school_admin",
    materials: (rows ?? []).map(toMaterial),
    collections,
  };
}

export const getTeacherLibrary = () => getLibrary("teacher");
export const getSchoolAdminLibrary = () => getLibrary("school_admin");

/** Loads one collection with its problems for the editor. 404s outside the viewer's school; other teachers' collections load read-only. */
export async function getLibraryCollectionEditor(role: LibraryRole, collectionId: string | null) {
  const base = role === "teacher" ? "/teacher/library" : "/school/library";
  const { userId, schoolId, accountName } = await libraryIdentity(role, collectionId ? `${base}/collections/${collectionId}` : `${base}/collections/new`);
  const supabase = await createClient();
  const { data: school } = await supabase.from("schools").select("name").eq("id", schoolId).maybeSingle();
  const shell = { accountName, schoolName: school?.name || "Сургууль", basePath: base };
  if (!collectionId) return { ...shell, collection: null, canEdit: true };

  const [{ data: row }, { data: problems, error }] = await Promise.all([
    supabase.from("school_library_collections").select("id, created_by, title, subject, year, variant, description, updated_at").eq("id", collectionId).eq("school_id", schoolId).maybeSingle(),
    supabase.from("school_library_materials").select(materialColumns).eq("collection_id", collectionId).order("position", { ascending: true }),
  ]);
  if (!row || error) notFound();
  const collection: LibraryCollection = {
    id: row.id,
    createdBy: row.created_by,
    title: row.title,
    subject: row.subject,
    year: row.year,
    variant: row.variant,
    description: row.description,
    updatedAt: row.updated_at,
    problems: (problems ?? []).map(toMaterial),
  };
  return { ...shell, collection, canEdit: role === "school_admin" || row.created_by === userId };
}
