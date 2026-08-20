import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border bg-white text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-red-700 text-white hover:bg-red-800"
};
const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-6" };

type Shared = { children: ReactNode; variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string };
export function Button({ className, variant = "primary", size = "md", ...props }: Shared & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />;
}
export function ButtonLink({ href, className, variant = "primary", size = "md", children }: Shared & { href: string }) {
  return <Link href={href} className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors", variants[variant], sizes[size], className)}>{children}</Link>;
}
