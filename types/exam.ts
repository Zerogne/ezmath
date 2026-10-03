export type ExamType = "SAT" | "EYESH";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type TestType = "full" | "practice" | "previous-year";

export type Test = {
  id: string;
  title: string;
  description: string;
  examType: ExamType;
  subject: string;
  year?: number;
  variant?: "A" | "B" | "C" | "D" | "E";
  questionCount: number;
  durationMinutes: number;
  difficulty?: Difficulty;
  type: TestType;
  module?: string;
  featured?: boolean;
};

export type Choice = { id: string; label: string; text: string; imageUrl?: string };

export type Question = {
  id: string;
  testId: string;
  questionNumber: number;
  questionText: string;
  choices: Choice[];
  correctAnswer: string;
  explanation?: string;
  topic?: string;
  difficulty?: Difficulty;
};

export type { CompletedAttempt, StudentQuestion, SubmissionResult, TestSession } from "@/lib/exam/test-types";
