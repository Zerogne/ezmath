import { ArrowRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export type ContinueStudyData = {
  testId: string;
  title: string;
  completed: number;
  total: number;
  lastActivity: string;
};

export function ContinueStudyCard({ data }: { data?: ContinueStudyData }) {
  if (!data) return <aside className="rounded-2xl border bg-white p-6 shadow-soft sm:p-7"><p className="eyebrow">Бэлтгэлээ эхлүүл</p><h2 className="mt-4 text-xl font-bold">Шалгалтаа сонгоорой</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">SAT эсвэл ЭЕШ-ийн бэлтгэлээс шууд эхлэх боломжтой.</p><div className="mt-6 grid grid-cols-2 gap-3"><ButtonLink href="/tests?exam=SAT">SAT</ButtonLink><ButtonLink href="/tests?exam=EYESH" variant="secondary">ЭЕШ</ButtonLink></div></aside>;
  const percent = Math.round((data.completed / data.total) * 100);
  return <aside className="rounded-2xl border bg-white p-6 shadow-soft sm:p-7" aria-label="Үргэлжлүүлэн суралцах">
    <div className="flex items-center justify-between"><p className="eyebrow">Үргэлжлүүлэн суралцах</p><Badge tone="blue">SAT</Badge></div>
    <h2 className="mt-5 text-xl font-bold">{data.title}</h2>
    <div className="mt-6 flex items-end justify-between"><p><strong className="text-2xl">{data.completed}</strong><span className="text-muted-foreground"> / {data.total} асуулт</span></p><span className="text-sm font-semibold text-primary">{percent}%</span></div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${percent}%` }}/></div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>{data.total - data.completed} асуулт үлдсэн</span><span className="inline-flex items-center gap-1.5"><Clock3 size={14}/>{data.lastActivity}</span></div>
    <ButtonLink href={`/tests/${data.testId}/take`} className="mt-7 w-full">Үргэлжлүүлэх <ArrowRight size={17}/></ButtonLink>
  </aside>;
}
