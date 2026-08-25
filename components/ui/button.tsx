import Link from "next/link";
import { cn } from "@/lib/utils";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border bg-white text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  danger: "bg-red-700 text-white hover:bg-red-800"
};
const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-sm", lg: "h-12 px-6" };

type Shared = { children: ReactNode; variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string };
type ButtonProps = Shared & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", type = "button", loading = false, disabled, children, ...props }, ref) {
  return <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props}>{children}</button>;
});
export function ButtonLink({ href, className, variant = "primary", size = "md", children, ...props }: Shared & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string }) {
  return <Link href={href} className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors aria-disabled:pointer-events-none aria-disabled:opacity-50", variants[variant], sizes[size], className)} {...props}>{children}</Link>;
}
