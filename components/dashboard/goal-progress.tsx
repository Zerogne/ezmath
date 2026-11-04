import Link from "next/link";
import { CalendarDays, Pencil } from "lucide-react";
import type { HistoryAttempt } from "@/lib/data/student-history";
import { daysUntil, estimateScaledScore, examDate, GOAL_RANGE, goalIncludes, type StudentGoal } from "@/lib/goals";

const card = "rounded-[22px] border-2 border-[#EEF0F6] bg-white";

/** Goal vs. latest result for each exam the student is preparing for, with a countdown to exam day. */
export function GoalProgress({ goal, attempts }: { goal: StudentGoal | null; attempts: HistoryAttempt[] }) {
  if (!goal) return null;
  const rows = (["EYESH", "SAT"] as const).filter((exam) => goalIncludes(goal, exam)).map((exam) => {
    const target = exam === "EYESH" ? goal.eyeshGoal : goal.satGoal;
    const latest = [...attempts].reverse().find((attempt) => attempt.examType === exam);
    const current = latest ? estimateScaledScore(exam, latest.score) : null;
    const date = examDate(goal, exam);
    return { exam, target, current, days: date ? daysUntil(date) : null };
  });

  return <section className={`${card} p-5 sm:p-[22px]`}>
    <div className="flex items-center justify-between gap-3"><h2 className="font-sans text-lg font-semibold tracking-normal">Миний зорилго</h2><Link href="/onboarding?edit=1" className="inline-flex items-center gap-1 text-sm font-semibold text-[#2B4BE8] hover:underline"><Pencil size={14}/>Засах</Link></div>
    <div className="mt-4 space-y-5">{rows.map(({ exam, target, current, days }) => {
      const gap = target !== null && current !== null ? target - current : null;
      const { min } = GOAL_RANGE[exam];
      const progress = target !== null && current !== null ? Math.max(0.03, Math.min(1, (current - min) / (target - min || 1))) : 0;
      return <div key={exam}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">{exam === "EYESH" ? "ЭЕШ · Математик" : "SAT · Math"}</p>
          {days !== null && days > 0 && <p className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B6275]"><CalendarDays size={13}/>{exam === "EYESH" ? "≈ " : ""}{days} хоног үлдлээ</p>}
        </div>
        <p className="mt-1.5 flex items-baseline gap-2 font-display text-[30px] font-medium leading-tight tracking-[-0.03em]">{current ?? "—"}<span className="font-sans text-sm font-medium text-[#9AA0B4]">/ {target ?? "—"} зорилго</span></p>
        <div className="mt-2 h-2 rounded-full bg-[#EEF0F6]"><i className={`block h-full rounded-full ${gap !== null && gap <= 0 ? "bg-[#16A34A]" : "bg-[#2B4BE8]"}`} style={{ width: `${progress * 100}%` }}/></div>
        <p className="mt-2 text-xs font-medium text-[#5B6275]">{current === null
          ? <>Түвшин тогтоох сорил өгч эхлэх оноогоо мэдээрэй. <Link href={`/tests?exam=${exam}`} className="font-semibold text-[#2B4BE8] hover:underline">Сорил сонгох →</Link></>
          : gap !== null && gap <= 0 ? "Зорилгодоо хүрлээ! Илүү өндөр зорилго тавих уу?" : `Зорилго хүртэл ${gap} оноо`}</p>
      </div>;
    })}</div>
  </section>;
}
