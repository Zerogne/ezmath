import { satAnswerMatches } from "@/lib/exam/sat-answer";

export type GradeState = "correct" | "incorrect" | "unanswered";

const normalize = (value: string) => value.trim().toLocaleLowerCase("mn").replace(/,/g, ".").replace(/\s+/g, " ");

/**
 * Grades a written (multi-blank) question: every field needs one of its accepted answers.
 * SAT fields follow the grid-in rules (equal fractions/decimals, truncated or rounded decimals).
 */
export function gradeWritten(fields: { id?: string }[], responses: Record<string, string>, acceptedFor: (fieldId: string) => string[], sat: boolean): GradeState {
  const matches = (value: string, answer: string) => sat ? satAnswerMatches(value, answer) : normalize(answer) === normalize(value);
  const hasResponse = fields.some((field) => field.id && normalize(responses[field.id] ?? ""));
  if (!hasResponse) return "unanswered";
  const allCorrect = fields.length > 0 && fields.every((field) => {
    if (!field.id) return false;
    const response = responses[field.id] ?? "";
    return normalize(response).length > 0 && acceptedFor(field.id).some((answer) => matches(response, answer));
  });
  return allCorrect ? "correct" : "incorrect";
}
