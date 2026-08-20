import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TestCard } from "@/components/home/test-card";
import type { Test } from "@/types/exam";
export function RecommendedTests({ tests }: { tests: Test[] }) { return <section className="container-page py-16 lg:py-20"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Дараагийн алхам</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Танд санал болгох</h2></div><Link href="/tests" className="group inline-flex items-center gap-2 text-sm font-semibold text-primary">Бүх шалгалт<ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/></Link></div><div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{tests.slice(0,3).map((test) => <TestCard key={test.id} test={test}/>)}</div></section>; }
