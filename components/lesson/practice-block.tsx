"use client";

import { useState } from "react";
import { Check, Eye, Lightbulb, PenLine, X } from "lucide-react";
import type { Practice } from "@/lib/learning/course-catalog";
import { MathText } from "@/components/math/math-text";

/** Loose comparison: case, spaces, $ signs and "," vs "." decimal marks don't matter. */
function normalize(value: string) {
  return value.toLowerCase().replace(/\$/g, "").replace(/\s+/g, "").replace(/,/g, ".");
}

/** Worked example and self-check test problem for a module, submodule or topic. */
export function PracticeBlock({ practice, compact = false }: { practice: Practice; compact?: boolean }) {
  return <div className={compact ? "space-y-3" : "space-y-4"}>
    {practice.example && <div className={`rounded-[18px] border-2 border-[#E8EEFF] bg-[#F7F9FF] ${compact ? "p-4" : "p-5"}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2B4BE8]"><Lightbulb size={14}/>Жишээ</p>
      <div className={`mt-2 whitespace-pre-line leading-relaxed ${compact ? "text-[15px]" : "text-[16px]"}`}><MathText>{practice.example}</MathText></div>
    </div>}
    {practice.problem && practice.answer && <TestProblem problem={practice.problem} answer={practice.answer} compact={compact}/>}
  </div>;
}

function TestProblem({ problem, answer, compact }: { problem: string; answer: string; compact: boolean }) {
  const accepted = answer.split(";").map((item) => item.trim()).filter(Boolean);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const check = (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    setResult(accepted.some((item) => normalize(item) === normalize(value)) ? "correct" : "incorrect");
  };
  const tone = result === "correct" ? "border-[#BBF7D0] bg-[#F0FDF4]" : result === "incorrect" ? "border-[#FECDD3] bg-[#FFF5F6]" : "border-[#EFE6FF] bg-[#FBF9FF]";

  return <div className={`rounded-[18px] border-2 transition-colors ${tone} ${compact ? "p-4" : "p-5"}`}>
    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7C4DEB]"><PenLine size={14}/>Өөрийгөө шалга</p>
    <div className={`mt-2 whitespace-pre-line leading-relaxed ${compact ? "text-[15px]" : "text-[16px]"}`}><MathText>{problem}</MathText></div>
    <form onSubmit={check} className="mt-4 flex gap-2">
      <input value={value} onChange={(event) => { setValue(event.target.value); setResult(null); }} aria-label="Таны хариу" placeholder="Хариугаа бич" className="h-11 min-w-0 flex-1 rounded-xl border-2 border-[#E3E6EF] bg-white px-3.5 text-[15px] outline-none transition focus:border-[#7C4DEB]"/>
      <button type="submit" disabled={!value.trim()} className="h-11 shrink-0 rounded-xl bg-[#0B1030] px-4 text-sm font-semibold text-white transition hover:bg-[#1A2150] disabled:opacity-40">Шалгах</button>
    </form>
    {result && <p role="status" className={`mt-3 flex items-center gap-1.5 text-sm font-semibold ${result === "correct" ? "text-[#15803D]" : "text-[#BE123C]"}`}>{result === "correct" ? <><Check size={16} strokeWidth={3}/>Зөв байна!</> : <><X size={16} strokeWidth={3}/>Буруу байна. Дахин оролдоод үзээрэй.</>}</p>}
    {result !== "correct" && <div className="mt-3">{revealed
      ? <p className="text-sm text-[#5B6275]">Зөв хариу: <b className="text-[#0B1030]"><MathText>{accepted.join(" эсвэл ")}</MathText></b></p>
      : <button type="button" onClick={() => setRevealed(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B6275] hover:text-[#0B1030]"><Eye size={15}/>Хариуг харах</button>}</div>}
  </div>;
}
