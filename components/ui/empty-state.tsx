import type { ReactNode } from "react";
import { Ezi, type EziPose } from "@/components/home/redesign/illustrations";

/** Friendly "nothing here" block with Эзи, used wherever a list, result or report has nothing to show. */
export function EmptyState({ title, text, pose = "sleep", action, heading: Heading = "h3", className = "" }: { title: string; text?: ReactNode; pose?: EziPose; action?: ReactNode; heading?: "h1" | "h2" | "h3"; className?: string }) {
  return <div className={`rounded-[22px] border-2 border-dashed border-[#E3E6EF] bg-white px-6 py-10 text-center ${className}`}>
    <Ezi pose={pose} size={120} className="mx-auto block"/>
    <Heading className="mt-3 text-xl font-medium">{title}</Heading>
    {text && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5B6275]">{text}</p>}
    {action && <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{action}</div>}
  </div>;
}
