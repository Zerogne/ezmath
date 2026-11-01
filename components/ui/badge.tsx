import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "green" | "blue"; className?: string }) {
  return <span className={cn("inline-flex rounded-md px-[7px] py-[3px] text-[11px] font-semibold", tone === "green" && "bg-[#E9FBF2] text-[#16A34A]", tone === "blue" && "bg-[#E8EEFF] text-[#2B4BE8]", tone === "neutral" && "bg-[#F1F3F8] text-[#5B6275]", className)}>{children}</span>;
}
