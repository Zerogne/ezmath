import { LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { Ezi, type EziPose } from "@/components/home/redesign/illustrations";

/** Sidebar footer for the teacher and school portals: navy account card with Эзи peeking over it (Figma 37:2 plan card style). */
export function PortalAccountCard({ label, title, subtitle, pose = "wave" }: { label: string; title: string; subtitle?: string; pose?: EziPose }) {
  return <div className="relative pt-14">
    <Ezi pose={pose} size={76} className="absolute left-[132px] top-0"/>
    <div className="rounded-[20px] bg-[#0B1030] p-[18px] text-white">
      <p className="text-[13px] font-medium text-[#AEB4CC]">{label}</p>
      <p className="mt-1.5 truncate font-display text-xl font-medium tracking-[-0.03em]">{title}</p>
      {subtitle && <p className="mt-0.5 truncate text-xs text-[#AEB4CC]">{subtitle}</p>}
      <form action={signOut}><button className="mt-3.5 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-[#0B1030] hover:bg-[#EEF1FF]"><LogOut size={15}/>Гарах</button></form>
    </div>
  </div>;
}
