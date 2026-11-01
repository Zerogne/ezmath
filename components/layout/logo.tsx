import Link from "next/link";
import { Ezi } from "@/components/home/redesign/illustrations";

/** Эзи + wordmark: the one brand mark used by every header, sidebar and footer. */
export function Logo({ href = "/", size = 46, className = "text-2xl" }: { href?: string; size?: number; className?: string }) {
  return <Link href={href} className={`flex items-center gap-2 font-display font-medium tracking-[-0.03em] ${className}`}><Ezi size={size}/>EzMath</Link>;
}
