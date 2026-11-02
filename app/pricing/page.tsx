import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Art, Ezi, ObjectArt, type ObjectKind } from "@/components/home/redesign/illustrations";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHero } from "@/components/layout/page-hero";
import { plans } from "@/lib/payments/plans";
import { startBylCheckout } from "@/app/payments/actions";

export const metadata: Metadata = { title: "Үнийн багц", alternates: { canonical: "/pricing" } };

const paymentMessages: Record<string, string> = {
  "checkout-failed": "BYL төлбөрийн хуудас үүсгэж чадсангүй. Түр хүлээгээд дахин оролдоно уу.",
  "order-failed": "Төлбөрийн захиалга үүсгэж чадсангүй. Дахин оролдоно уу.",
  "invalid-plan": "Сонгосон багц хүчингүй байна.",
  canceled: "Төлбөр цуцлагдлаа. Та хүссэн үедээ дахин оролдож болно.",
};

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const { payment } = await searchParams;
  return <>
    <Navbar/>
    <main className="py-12 sm:py-16">
      <div className="container-page"><PageHero chip="Үнийн багц" chipIcon="₮" chipBg="#FFB020" title="Өөрт тохирох багцаа сонго" text="Төлбөртэй багцын эрх сар бүр сунгагдах бөгөөд хүссэн үедээ цуцлах бүрэн боломжтой." pose="trophy"/></div>
      {payment && paymentMessages[payment] && <p role="alert" className="container-page mt-6 rounded-[18px] border-2 border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{paymentMessages[payment]}</p>}
      <div className="container-page mt-10 grid items-stretch gap-5 lg:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.code} {...plan}/>)}</div>
      <p className="container-page mt-5 text-center text-sm text-[#5B6275]">Төлбөрийг BYL-ийн аюулгүй хуудсаар төлнө. Сунгалт бүрийг төлбөрийн хүсэлтээр баталгаажуулна — картаас автоматаар татахгүй.</p>
      <Comparison/>
      <Schools/>
      <Faq/>
    </main>
    <SiteFooter/>
  </>;
}

const planArt: Record<string, [ObjectKind, string]> = { free: ["pencil", "#F1F3F8"], standard_monthly: ["target", "#E8EEFF"], mentor_monthly: ["gradcap", "#FFF6CC"] };

function PlanCard({ code, name, priceLabel, interval, items, cta, featured = false }: (typeof plans)[number]) {
  const [art, tile] = planArt[code] ?? ["notebook", "#E8EEFF"];
  const buttonClass = `mt-7 inline-flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition ${featured ? "bg-[#2B4BE8] text-white hover:bg-[#2440C8]" : "border-2 border-[#E3E6EF] bg-white text-[#0B1030] hover:border-[#C9CDDA]"}`;
  return <article className={`relative flex flex-col rounded-[28px] p-7 ${featured ? "bg-[#0B1030] text-white shadow-[0_30px_60px_-24px_rgba(11,16,48,.45)]" : "border-2 border-[#EEF0F6] bg-white"}`}>
    {featured && <span className="absolute right-6 top-6 rounded-full bg-[#FFF6CC] px-3 py-1 text-[11px] font-semibold text-[#0B1030]">Хамгийн эрэлттэй</span>}
    <span className="grid h-14 w-14 place-items-center rounded-[18px]" style={{ background: featured ? "rgba(255,255,255,.1)" : tile }}><ObjectArt kind={art} size={44}/></span>
    <h3 className="mt-4 text-xl font-medium">{name}</h3>
    <p className="mt-5 font-display text-[44px] font-medium leading-none tracking-[-0.03em]">{priceLabel}{interval && <small className={`ml-1 text-sm font-normal ${featured ? "text-slate-400" : "text-muted-foreground"}`}>/сар</small>}</p>
    <ul className="mt-6 flex-1 space-y-3 text-sm">{items.map((item) => <li key={item} className="flex items-start gap-2.5"><Check size={15} strokeWidth={3} className={`mt-0.5 shrink-0 ${featured ? "text-[#8FA3FF]" : "text-[#2B4BE8]"}`}/>{item}</li>)}</ul>
    {code === "free" ? <Link href="/register" className={buttonClass}>{cta}</Link> : <form action={startBylCheckout}><input type="hidden" name="planCode" value={code}/><button type="submit" className={buttonClass}>{cta}</button></form>}
  </article>;
}

const rows: [string, boolean | string, boolean | string, boolean | string][] = [
  ["ЭЕШ ба mock шалгалт", "1 удаа", "Бүгд", "Бүгд"],
  ["Сэдэвчилсэн дасгал", "Өдөрт 10", "Хязгааргүй", "Хязгааргүй"],
  ["Онолын хичээл", "Туршилтын", true, true],
  ["Шалгалтын дэлгэрэнгүй тайлан", false, true, true],
  ["AI гүйцэтгэлийн анализ", false, true, true],
  ["AI сургалтын хуваарь", false, true, true],
  ["7 хоног бүр 1:1 менторын уулзалт", false, false, true],
  ["Эцэг эхэд сар бүрийн ахицын тайлан", false, false, true],
  ["Priority чат дэмжлэг", false, false, true],
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-[#E8EEFF] text-[#2B4BE8]"><Check size={14} strokeWidth={3}/></span>;
  if (value === false) return <Minus size={16} className="mx-auto text-[#C9CDDA]"/>;
  return <span className="text-sm font-medium text-[#5B6275]">{value}</span>;
}

function Comparison() {
  return <section className="container-page pt-24">
    <h2 className="text-center text-[34px] font-medium leading-tight tracking-[-0.03em] sm:text-[44px]">Багцуудыг харьцуулах</h2>
    <div className="mt-10 overflow-x-auto rounded-[24px] border-2 border-[#EEF0F6] bg-white">
      <table className="w-full min-w-[640px] text-left">
        <thead><tr className="border-b-2 border-[#EEF0F6]"><th className="px-6 py-5 text-sm font-semibold text-[#5B6275]">Боломж</th>{plans.map((plan) => <th key={plan.code} className={`px-4 py-5 text-center font-display text-lg font-medium ${plan.featured ? "bg-[#F5F7FF] text-[#2B4BE8]" : ""}`}>{plan.name}</th>)}</tr></thead>
        <tbody>{rows.map(([label, ...values]) => <tr key={label} className="border-b-2 border-[#F4F5FA] last:border-0"><td className="px-6 py-4 text-[15px] font-medium">{label}</td>{values.map((value, index) => <td key={index} className={`px-4 py-4 text-center ${plans[index]?.featured ? "bg-[#F5F7FF]" : ""}`}><Cell value={value}/></td>)}</tr>)}</tbody>
      </table>
    </div>
  </section>;
}

function Schools() {
  return <section className="container-page pt-24">
    <div className="relative grid items-center gap-8 overflow-hidden rounded-[28px] bg-[#0B1030] px-7 py-10 text-white sm:px-12 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-[#C7D2FF]">Сургууль, багш нарт</span>
        <h2 className="mt-4 text-[30px] font-medium leading-tight tracking-[-0.03em] sm:text-[40px]">Ангиараа EzMath ашиглах уу?</h2>
        <p className="mt-3 max-w-[560px] text-[17px] leading-relaxed text-[#AEB4CC]">Багш нар анги үүсгэж, кодоор сурагчдаа урина. Ангийн шалгалт өгч, сурагч бүрийн ахицыг нэг дороос хянана.</p>
        <div className="mt-7 flex flex-wrap gap-2.5"><Link href="/register" className="inline-flex h-[52px] items-center gap-2 rounded-full bg-white px-[26px] text-[17px] font-medium text-[#0B1030] transition hover:bg-[#EEF1FF]">Багшаар бүртгүүлэх<ArrowRight size={16}/></Link><Link href="/login" className="inline-flex h-[52px] items-center rounded-full border-2 border-white/20 px-[26px] text-[17px] font-medium text-white transition hover:border-white/40">Багшаар нэвтрэх</Link></div>
      </div>
      <div className="relative hidden h-[220px] lg:block"><Art name="friend-mint" size={120} className="absolute bottom-0 left-0"/><Ezi pose="wave" size={170} className="absolute bottom-0 left-[90px]"/><Art name="friend-sun" size={104} className="absolute bottom-0 right-0"/></div>
    </div>
  </section>;
}

const faqs = [
  ["Багцаа цуцалж болох уу?", "Тийм. Төлбөртэй багц сар бүр BYL-ээр төлбөрийн хүсэлт илгээж сунгагдана — картаас автоматаар татагдахгүй. Захиалгаа цуцлахад багцын эрх хаагдана."],
  ["Үнэгүй эрхээр юу хийж болох вэ?", "ЭЕШ-ын бүтэн сорил эсвэл нэг удаагийн mock шалгалт өгч, өдөрт 10 сэдэвчилсэн дасгал бодож, туршилтын хичээл үзэх боломжтой."],
  ["Стандарт болон Ментор+ багцын ялгаа юу вэ?", "Ментор+ багцад Стандартын бүх боломж дээр нэмээд 7 хоног бүрийн 1:1 менторын уулзалт, ментороор хянуулсан хувийн төлөвлөгөө, эцэг эхэд очих сар бүрийн тайлан багтана."],
  ["Төлсний дараа эрх хэзээ нээгдэх вэ?", "Төлбөрийн хуудас BYL дээр нээгдэнэ. Төлбөр баталгаажмагц багцын эрх таны бүртгэлд автоматаар нээгдэнэ."],
];

function Faq() {
  return <section className="container-page pb-8 pt-24">
    <h2 className="text-center text-[34px] font-medium leading-tight tracking-[-0.03em] sm:text-[44px]">Түгээмэл асуултууд</h2>
    <div className="mx-auto mt-10 max-w-[880px] space-y-3">{faqs.map(([question, answer]) => <details key={question} className="group rounded-[20px] border-2 border-[#EEF0F6] bg-white px-6 py-5 open:border-[#DCE5FF]"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium [&::-webkit-details-marker]:hidden">{question}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F1F3F8] text-lg transition group-open:rotate-45">+</span></summary><p className="mt-3 text-[15px] leading-relaxed text-[#5B6275]">{answer}</p></details>)}</div>
  </section>;
}
