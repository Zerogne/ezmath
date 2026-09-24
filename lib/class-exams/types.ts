import type { SchoolLibraryAnswerType } from "@/lib/supabase/database.types";

export type ClassExamChoice = { label: string; text: string };

export type ClassExamQuestionInput = {
  localId: string;
  sourceMaterialId?: string;
  title: string;
  topic: string;
  questionLatex: string;
  answerType: SchoolLibraryAnswerType;
  answerKey: string;
  choices: ClassExamChoice[];
  maxPoints: number;
  saveToLibrary?: boolean;
};

export type ClassExamQuestionPayload =
  | {
      sourceMaterialId: string;
      maxPoints: number;
    }
  | {
      sourceMaterialId?: undefined;
      title: string;
      topic: string;
      questionLatex: string;
      answerType: SchoolLibraryAnswerType;
      answerKey: string;
      choices: ClassExamChoice[];
      maxPoints: number;
      saveToLibrary?: boolean;
    };

export type CreateClassExamInput = {
  classroomId: string;
  title: string;
  instructions: string;
  durationMinutes: number;
  publishMode: "draft" | "immediate" | "scheduled";
  startsAt?: string;
  closesAt?: string;
  questions: ClassExamQuestionPayload[];
};

export type ClassExamStudentAnswer = {
  questionId: string;
  selectedChoice?: string;
  responseText?: string;
};

export const MAX_CLASS_EXAM_ACTION_BYTES = 3_500_000;

export function serializedClassExamBytes(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
