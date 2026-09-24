import type { ClassExamChoice } from "@/lib/class-exams/types";
import type { Json } from "@/lib/supabase/database.types";

export function normalizeChoices(value: unknown): ClassExamChoice[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((choice, index) => {
    const item = choice && typeof choice === "object" && !Array.isArray(choice) ? choice as { text?: unknown } : {};
    return { label: String.fromCharCode(65 + index), text: String(item.text ?? "").trim() };
  });
}

export function parseChoices(value: Json): ClassExamChoice[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((choice) => {
    if (!choice || typeof choice !== "object" || Array.isArray(choice)) return [];
    const label = typeof choice.label === "string" ? choice.label : "";
    const text = typeof choice.text === "string" ? choice.text : "";
    return label && text ? [{ label, text }] : [];
  });
}
