import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function LessonBreadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
    {items.map((item, index) => <span key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1">
      {index > 0 && <ChevronRight size={14} className="shrink-0"/>}
      {item.href ? <Link href={item.href} className="truncate hover:text-foreground">{item.label}</Link> : <span className="truncate font-medium text-foreground">{item.label}</span>}
    </span>)}
  </nav>;
}
