import type { Difficulty, ExamType, TestType } from "@/types/exam";

export type MaterialChoice = { id: string; label: string; text: string; imageUrl: string };
export type MaterialResponseField = { id: string; label: string; acceptedAnswers: string[] };
export type MaterialQuestion = {
  id: string;
  text: string;
  imageUrl: string;
  questionType: "multiple-choice" | "multi-blank";
  responseFields: MaterialResponseField[];
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
  variant?: "A" | "B" | "C" | "D" | "E";
  durationMinutes: number;
  type: TestType;
  status: "draft" | "published" | "archived";
  description: string;
  questions: MaterialQuestion[];
};
