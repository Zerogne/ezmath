import Link from "next/link";
import { ArrowRight, Clock3, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ObjectArt } from "@/components/home/redesign/illustrations";
import { formatDuration } from "@/lib/utils";
import type { Test } from "@/types/exam";

export function TestCard({ test }: { test: Test }) { return <article className="flex h-full flex-col rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#C9D3FF] hover:shadow-[0_18px_40px_-20px_rgba(11,16,48,.25)]"><div className="flex items-start justify-between"><Badge tone={test.examType === "SAT" ? "blue" : "green"}>{test.examType === "EYESH" ? "ЭЕШ" : "SAT"}</Badge><span className={`grid h-14 w-14 place-items-center rounded-[18px] ${test.examType === "SAT" ? "bg-[#E8EEFF]" : "bg-[#E9FBF2]"}`}><ObjectArt kind={test.examType === "SAT" ? "calculator" : "chart"} size={44}/></span></div><h3 className="mt-3 text-lg font-medium leading-snug">{test.title}</h3><div className="mt-3 flex gap-4 text-sm text-[#5B6275]"><span className="inline-flex items-center gap-1.5"><ListChecks size={15}/>{test.questionCount} бодлого</span><span className="inline-flex items-center gap-1.5"><Clock3 size={15}/>{formatDuration(test.durationMinutes)}</span></div><Link href={`/tests/${test.id}`} className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[#2B4BE8] hover:gap-2.5">Дэлгэрэнгүй <ArrowRight size={15}/></Link></article>; }
