import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "green" | "blue"; className?: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone === "green" && "bg-emerald-50 text-emerald-800", tone === "blue" && "bg-blue-50 text-blue-800", tone === "neutral" && "bg-muted text-muted-foreground", className)}>{children}</span>;
}
