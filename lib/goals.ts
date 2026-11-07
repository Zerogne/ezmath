import type { Test } from "@/types/exam";
import type { StudentGoalFields, StudentGrade, TargetExam } from "@/lib/supabase/database.types";

export type StudentGoal = {
  targetExam: TargetExam;
  eyeshGoal: number | null;
  satGoal: number | null;
  eyeshExamYear: number | null;
  /** First day of the planned SAT month, YYYY-MM-DD. */
  satExamMonth: string | null;
  grade: StudentGrade | null;
  weeklyStudyHours: number | null;
  targetUniversity: string | null;
};

export const GOAL_COLUMNS = "target_exam, eyesh_goal, sat_goal, eyesh_exam_year, sat_exam_month, grade, weekly_study_hours, target_university, onboarded_at";

export function goalFromProfile(row: Partial<StudentGoalFields> | null | undefined): StudentGoal | null {
  if (!row?.target_exam) return null;
  return {
    targetExam: row.target_exam,
    eyeshGoal: row.eyesh_goal ?? null,
    satGoal: row.sat_goal ?? null,
    eyeshExamYear: row.eyesh_exam_year ?? null,
    satExamMonth: row.sat_exam_month ?? null,
    grade: row.grade ?? null,
    weeklyStudyHours: row.weekly_study_hours ?? null,
    targetUniversity: row.target_university ?? null,
  };
}

export function goalIncludes(goal: StudentGoal | null, exam: "EYESH" | "SAT") {
  return goal ? goal.targetExam === "BOTH" || goal.targetExam === exam : false;
}

/** Primary exam for ordering tests and picking the placement test. "BOTH" leans on ЭЕШ, the larger audience. */
export function primaryExam(goal: StudentGoal | null): "EYESH" | "SAT" | null {
  if (!goal) return null;
  return goal.targetExam === "SAT" ? "SAT" : "EYESH";
}

/** Goal score range per exam: ЭЕШ is scored 0–800, the SAT Math section 200–800. */
export const GOAL_RANGE = { EYESH: { min: 0, max: 800 }, SAT: { min: 200, max: 800 } } as const;

/** ЭЕШ is held in early June; SAT dates are stored as the first of the chosen month. */
export function examDate(goal: StudentGoal, exam: "EYESH" | "SAT"): Date | null {
  if (exam === "EYESH") return goal.eyeshExamYear ? new Date(Date.UTC(goal.eyeshExamYear, 5, 1)) : null;
  return goal.satExamMonth ? new Date(`${goal.satExamMonth}T00:00:00Z`) : null;
}

export function daysUntil(date: Date, now = new Date()) {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

export const GRADE_LABELS: Record<StudentGrade, string> = { "9": "9-р анги", "10": "10-р анги", "11": "11-р анги", "12": "12-р анги", graduated: "Төгссөн" };
export const EXAM_LABELS: Record<TargetExam, string> = { EYESH: "ЭЕШ", SAT: "SAT", BOTH: "ЭЕШ ба SAT" };

/** Stable sort that lists the student's own exam first. */
export function sortByExam(tests: Test[], exam: "EYESH" | "SAT" | null) {
  return exam ? [...tests].sort((a, b) => Number(b.examType === exam) - Number(a.examType === exam)) : tests;
}
