import type { Choice } from "@/types/exam";

export type SessionStatus = "not_started" | "in_progress" | "submitted";
export type SyncStatus = "saved" | "saving" | "offline";

export type StudentQuestion = {
  id: string;
  testId: string;
  questionNumber: number;
  questionText: string;
  choices: Choice[];
  topic?: string;
  imageUrl?: string;
  questionType?: "multiple-choice" | "multi-blank";
  responseFields?: { id: string; label: string }[];
};

export type TestSession = {
  attemptId?: string;
  testId: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  writtenAnswers: Record<string, Record<string, string>>;
  markedForReview: string[];
  startedAt: string;
  remainingSeconds: number;
  lastSavedAt?: string;
  version: number;
  status: SessionStatus;
};

export type SubmissionPayload = {
  attemptId?: string;
  testId: string;
  answers: { questionId: string; selectedChoiceId: string }[];
  writtenAnswers: { questionId: string; responses: Record<string, string> }[];
  markedForReview: string[];
  durationSeconds: number;
  startedAt: string;
};

export type SubmissionResult = {
  score: number;
  maxScore: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  durationSeconds: number;
  answerResults: Record<string, "correct" | "incorrect" | "unanswered">;
  topicBreakdown: { topic: string; correct: number; total: number; accuracy: number }[];
};

export type CompletedAttempt = TestSession & { completedAt: string; result: SubmissionResult };
