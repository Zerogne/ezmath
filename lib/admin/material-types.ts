import type { Difficulty, ExamType, TestType } from "@/types/exam";

export type MaterialChoice = { id: string; label: string; text: string };
export type MaterialQuestion = {
  id: string;
  text: string;
  choices: MaterialChoice[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: Difficulty;
};

export type MaterialEditorData = {
  id?: string;
  examType: ExamType;
  title: string;
  subject: string;
  year?: number;
  durationMinutes: number;
  type: TestType;
  status: "draft" | "published" | "archived";
  description: string;
  questions: MaterialQuestion[];
};
