import Link from "next/link";
import { cn } from "@/lib/utils";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";

const variants = {
  primary: "bg-[#0B1030] text-white hover:bg-[#1A2150]",
  brand: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border-2 border-[#E3E6EF] bg-white text-[#0B1030] hover:border-[#C9CDDA]",
  ghost: "text-foreground hover:bg-[#F1F3F8]",
  danger: "bg-red-700 text-white hover:bg-red-800"
};
const sizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-5 text-sm", lg: "h-[52px] px-[26px] text-base" };

type Shared = { children: ReactNode; variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string };
type ButtonProps = Shared & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ className, variant = "primary", size = "md", type = "button", loading = false, disabled, children, ...props }, ref) {
  return <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={cn("inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} {...props}>{children}</button>;
});
export function ButtonLink({ href, className, variant = "primary", size = "md", children, ...props }: Shared & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string }) {
  const classes = cn("inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors aria-disabled:pointer-events-none aria-disabled:opacity-50", variants[variant], sizes[size], className);
  // OAuth endpoints must perform a document navigation. Next client navigation
  // follows the external provider redirect as fetch(), which CSP correctly blocks.
  if (href.startsWith("/auth/google")) return <a href={href} className={classes} {...props}>{children}</a>;
  return <Link href={href} className={classes} {...props}>{children}</Link>;
}
