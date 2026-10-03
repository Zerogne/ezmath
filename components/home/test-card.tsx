import { ArrowRight, Clock3, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import type { Test } from "@/types/exam";

export function TestCard({ test }: { test: Test }) { return <article className="flex h-full flex-col rounded-xl border bg-white p-5 transition hover:border-primary/25"><Badge tone={test.examType === "SAT" ? "blue" : "green"}>{test.examType === "EYESH" ? "ЭЕШ" : "SAT"}</Badge><h3 className="mt-5 font-semibold leading-6">{test.title}</h3><div className="mt-3 flex gap-4 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><ListChecks size={15}/>{test.questionCount} бодлого</span><span className="inline-flex items-center gap-1.5"><Clock3 size={15}/>{formatDuration(test.durationMinutes)}</span></div><ButtonLink href={`/tests/${test.id}`} variant="ghost" className="mt-5 justify-start px-0 text-primary hover:bg-transparent">Дэлгэрэнгүй <ArrowRight size={15}/></ButtonLink></article>; }
