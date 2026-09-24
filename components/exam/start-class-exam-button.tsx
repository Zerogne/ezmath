"use client";

import { useState, useTransition } from "react";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { startClassExamSubmission } from "@/app/class-exam-actions";

export function StartClassExamButton({ examId, label = "Шалгалт эхлэх" }: { examId: string; label?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return <div><button type="button" disabled={pending} onClick={() => startTransition(async () => { setError(null); const result = await startClassExamSubmission(examId); if (result.error && !result.id) { setError(result.error); return; } if (result.id && result.error) { router.push(`/dashboard/exams/${examId}/result`); return; } router.push(`/dashboard/exams/${examId}/take`); })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"><Play size={16}/>{pending ? "Эхлүүлж байна…" : label}</button>{error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}</div>;
}
