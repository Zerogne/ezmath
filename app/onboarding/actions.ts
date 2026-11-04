"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StudentGrade, TargetExam } from "@/lib/supabase/database.types";
import { GOAL_RANGE } from "@/lib/goals";

export type GoalInput = {
  targetExam: TargetExam;
  eyeshGoal: number | null;
  satGoal: number | null;
  eyeshExamYear: number | null;
  /** YYYY-MM */
  satExamMonth: string | null;
  grade: StudentGrade | null;
  weeklyStudyHours: number | null;
  targetUniversity: string;
};

const GRADES: StudentGrade[] = ["9", "10", "11", "12", "graduated"];

function score(value: number | null, exam: "EYESH" | "SAT") { const { min, max } = GOAL_RANGE[exam]; return value !== null && Number.isInteger(value) && value >= min && value <= max ? value : null; }

export async function saveStudentGoals(input: GoalInput): Promise<{ error?: string }> {
  if (!["EYESH", "SAT", "BOTH"].includes(input.targetExam)) return { error: "Аль шалгалтад бэлдэж байгаагаа сонгоно уу." };
  const wantsEyesh = input.targetExam !== "SAT";
  const wantsSat = input.targetExam !== "EYESH";
  const eyeshGoal = wantsEyesh ? score(input.eyeshGoal, "EYESH") : null;
  const satGoal = wantsSat ? score(input.satGoal, "SAT") : null;
  if (wantsEyesh && eyeshGoal === null) return { error: "ЭЕШ-ийн зорилтот оноо 0–800 хооронд байна." };
  if (wantsSat && satGoal === null) return { error: "SAT Math-ийн зорилтот оноо 200–800 хооронд байна." };
  const thisYear = new Date().getFullYear();
  const eyeshExamYear = wantsEyesh && input.eyeshExamYear && input.eyeshExamYear >= thisYear && input.eyeshExamYear <= thisYear + 4 ? input.eyeshExamYear : null;
  const satExamMonth = wantsSat && input.satExamMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(input.satExamMonth) ? `${input.satExamMonth}-01` : null;
  const grade = input.grade && GRADES.includes(input.grade) ? input.grade : null;
  const hours = input.weeklyStudyHours && Number.isInteger(input.weeklyStudyHours) && input.weeklyStudyHours >= 1 && input.weeklyStudyHours <= 60 ? input.weeklyStudyHours : null;
  const university = input.targetUniversity.trim().slice(0, 120) || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Дахин нэвтэрнэ үү." };
  const { error } = await supabase.from("profiles").update({
    target_exam: input.targetExam,
    eyesh_goal: eyeshGoal,
    sat_goal: satGoal,
    eyesh_exam_year: eyeshExamYear,
    sat_exam_month: satExamMonth,
    grade,
    weekly_study_hours: hours,
    target_university: university,
    onboarded_at: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) return { error: "Зорилгыг хадгалж чадсангүй. Дахин оролдоно уу." };
  revalidatePath("/dashboard", "layout");
  revalidatePath("/tests");
  return {};
}
