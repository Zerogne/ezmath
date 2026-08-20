import { ArrowRight, BarChart3, CheckCircle2, Clock3, Target } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return <section className="container-page grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
    <div className="max-w-2xl">
      <p className="eyebrow mb-4">SAT & ЭЕШ бэлтгэлийн орчин</p>
      <h1 className="text-4xl font-bold leading-[1.12] sm:text-5xl">Шалгалтаа бодитоор бэлд. <span className="text-primary">Ахицаа тоогоор хар.</span></h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">SAT болон ЭЕШ-ийн жишиг шалгалт, өмнөх оны материал, дэлгэрэнгүй гүйцэтгэлийн тайланг нэг дороос.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row"><ButtonLink href="/tests" size="lg">Шалгалт эхлэх <ArrowRight size={18} /></ButtonLink><ButtonLink href="/tests?exam=EYESH" variant="secondary" size="lg">ЭЕШ материал үзэх</ButtonLink></div>
    </div>
    <div className="relative rounded-2xl border bg-white p-5 shadow-soft sm:p-7" aria-label="Гүйцэтгэлийн жишээ">
      <div className="flex items-center justify-between border-b pb-5"><div><p className="text-sm text-muted-foreground">Энэ долоо хоног</p><p className="mt-1 font-semibold">SAT Math гүйцэтгэл</p></div><span className="rounded-lg bg-emerald-50 p-2 text-primary"><BarChart3 size={20} /></span></div>
      <div className="grid grid-cols-2 gap-3 py-5"><Metric icon={<Target />} label="Нарийвчлал" value="86%"/><Metric icon={<Clock3 />} label="Дундаж хугацаа" value="1:24"/></div>
      <div className="rounded-xl bg-muted p-4"><div className="mb-2 flex justify-between text-sm"><span>Долоо хоногийн зорилго</span><strong>4 / 5</strong></div><div className="h-2 overflow-hidden rounded-full bg-white"><div className="h-full w-4/5 rounded-full bg-primary" /></div></div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="text-primary" size={17} />Сүүлийн дасгалын оноо 12%-аар өссөн</div>
    </div>
  </section>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-xl border p-4"><span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span><p className="mt-4 text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>; }
