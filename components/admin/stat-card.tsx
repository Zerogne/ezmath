import type { LucideIcon } from "lucide-react";

const TONES = ["#E8EEFF", "#E9FBF2", "#FFF0E6", "#EFE6FF", "#FFF6CC", "#FFE8EF"] as const;

/** KPI card matching the Figma admin dashboard: tinted icon tile, label, display-font value and note. */
export function AdminStatCard({ label, value, icon: Icon, note, tone = 0 }: { label: string; value: string; icon: LucideIcon; note?: string; tone?: number }) {
  return (
    <article className="flex items-center gap-4 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] text-[#0B1030]" style={{ background: TONES[tone % TONES.length] }}><Icon size={22}/></span>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#5B6275]">{label}</p>
        <p className="mt-0.5 truncate font-display text-[26px] font-medium leading-tight tracking-[-0.03em]">{value}</p>
        {note && <p className="mt-0.5 text-xs font-medium text-[#5B6275]">{note}</p>}
      </div>
    </article>
  );
}
