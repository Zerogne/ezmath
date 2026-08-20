import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ExamPathCard({ badge, title, description, subjects, href, cta, meta, tone }: { badge: string; title: string; description: string; subjects: string[]; href: string; cta: string; meta: string; tone: "blue" | "green" }) {
  return <Link href={href} className="group flex min-h-72 flex-col rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5 hover:border-primary/30 sm:p-8"><div className="flex items-center justify-between"><Badge tone={tone}>{badge}</Badge><span className="text-xs text-muted-foreground">{meta}</span></div><h3 className="mt-8 text-2xl font-bold">{title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-5 flex flex-wrap gap-2">{subjects.map((subject) => <span key={subject} className="rounded-lg bg-muted px-3 py-2 text-xs font-medium">{subject}</span>)}</div><span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-primary">{cta}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></span></Link>;
}
