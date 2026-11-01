import type { ReactNode } from "react";
import { ObjectArt, type ObjectKind } from "@/components/home/redesign/illustrations";

/** Building blocks shared by the student, teacher and school portals (Figma "03 · Dashboards" style). */
export const portalCard = "rounded-[22px] border-2 border-[#EEF0F6] bg-white";
export const portalMuted = "text-[#5B6275]";
export const btnSmDark = "inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#0B1030] px-5 text-sm font-medium text-white transition hover:bg-[#1A2150] disabled:opacity-50";
export const btnSmOutline = "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border-2 border-[#E3E6EF] bg-white px-5 text-sm font-medium text-[#0B1030] transition hover:border-[#C9CDDA]";
export const portalInput = "h-12 w-full rounded-xl border-2 border-[#E3E6EF] bg-white px-4 text-[15px] font-normal outline-none transition placeholder:text-[#9AA0B4] focus:border-[#2B4BE8]";

export function ArtTile({ kind, bg, size = 64, art = 56, className = "" }: { kind: ObjectKind; bg: string; size?: number; art?: number; className?: string }) {
  return <span className={`grid shrink-0 place-items-center rounded-[20px] ${className}`} style={{ background: bg, width: size, height: size }}><ObjectArt kind={kind} size={art}/></span>;
}

export function StatCard({ art, tile, label, value, note, positive = false }: { art: ObjectKind; tile: string; label: string; value: string; note: string; positive?: boolean }) {
  return <article className={`${portalCard} flex items-center gap-3.5 p-4 sm:p-[22px]`}>
    <ArtTile kind={art} bg={tile} className="hidden sm:grid"/>
    <div className="min-w-0"><p className="text-[13px] font-medium text-[#5B6275]">{label}</p><p className="mt-0.5 font-display text-[24px] font-medium leading-tight tracking-[-0.03em] sm:text-[30px]">{value}</p><p className={`mt-0.5 text-xs font-medium ${positive ? "text-[#16A34A]" : "text-[#5B6275]"}`}>{note}</p></div>
  </article>;
}

export function Chip({ icon, children, tone = "plain" }: { icon?: ReactNode; children: ReactNode; tone?: "plain" | "blue" | "violet" | "green" | "amber" | "grey" }) {
  const tones = { plain: "border-2 border-[#EEF0F6] bg-white text-[#0B1030]", blue: "bg-[#E8EEFF] text-[#2B4BE8]", violet: "bg-[#EFE6FF] text-[#7C4DEB]", green: "bg-[#DCFCE7] text-[#15803D]", amber: "bg-[#FEF3C7] text-[#B45309]", grey: "bg-[#F1F3F8] text-[#5B6275]" };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{icon}{children}</span>;
}

export function SectionTitle({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-sans text-lg font-semibold tracking-normal">{title}</h2>{text && <p className={`mt-1 text-sm ${portalMuted}`}>{text}</p>}</div>{action}</div>;
}
