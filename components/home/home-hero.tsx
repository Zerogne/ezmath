import { ArrowRight, BarChart3, CheckCircle2, FileCheck2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ContinueStudyCard, type ContinueStudyData } from "./continue-study-card";

const features = [{ icon: FileCheck2, label: "SAT Mock Tests" }, { icon: CheckCircle2, label: "ЭЕШ материал" }, { icon: BarChart3, label: "Дэлгэрэнгүй тайлан" }];

export function HomeHero({ continuation }: { continuation?: ContinueStudyData }) {
  return <section className="container-page grid items-center gap-10 py-14 md:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)] lg:gap-16 lg:py-20">
    <div className="max-w-2xl"><p className="eyebrow">SAT & ЭЕШ бэлтгэлийн орчин</p><h1 className="mt-4 text-4xl font-bold leading-[1.12] sm:text-5xl">Шалгалтаа бодитоор бэлд.<br/><span className="text-primary">Ахицаа тоогоор хар.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">SAT болон ЭЕШ-ийн жишиг шалгалт, өмнөх оны материал, дэлгэрэнгүй гүйцэтгэлийн тайланг нэг дороос.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/tests" size="lg">Шалгалт эхлэх <ArrowRight size={18}/></ButtonLink><ButtonLink href="/tests?exam=EYESH" variant="secondary" size="lg">ЭЕШ материал үзэх</ButtonLink></div><div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t pt-5">{features.map(({ icon: Icon, label }) => <span key={label} className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon size={15} className="text-primary"/>{label}</span>)}</div></div>
    <ContinueStudyCard data={continuation}/>
  </section>;
}
