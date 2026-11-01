import type { ReactNode } from "react";
import { Ezi, type EziPose } from "@/components/home/redesign/illustrations";

/** Page title block in the homepage's feature-heading style: icon chip, large display title, muted lead and an optional Эзи. */
export function PageHero({ chip, chipIcon, chipBg = "#2B4BE8", title, text, pose, children }: { chip: string; chipIcon: ReactNode; chipBg?: string; title: ReactNode; text?: ReactNode; pose?: EziPose; children?: ReactNode }) {
  return <header className="flex items-end justify-between gap-6">
    <div>
      <span className="inline-flex items-center gap-2.5 text-[15px] font-medium"><i className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[9px] font-display text-[15px] font-bold not-italic text-white" style={{ background: chipBg }}>{chipIcon}</i>{chip}</span>
      <h1 className="mt-4 text-4xl font-medium leading-[1.08] sm:text-5xl lg:text-[56px]">{title}</h1>
      {text && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#5B6275]">{text}</p>}
      {children}
    </div>
    {pose && <Ezi pose={pose} size={160} className="hidden shrink-0 sm:block"/>}
  </header>;
}
