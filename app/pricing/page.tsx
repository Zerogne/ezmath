import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
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
    </main>
    <SiteFooter/>
  </>;
}

function PlanCard({ code, name, priceLabel, interval, items, cta, featured = false }: (typeof plans)[number]) {
  const buttonClass = `mt-7 inline-flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-semibold transition ${featured ? "bg-[#2B4BE8] text-white hover:bg-[#2440C8]" : "border-2 border-[#E3E6EF] bg-white text-[#0B1030] hover:border-[#C9CDDA]"}`;
  return <article className={`relative flex flex-col rounded-[28px] p-7 ${featured ? "bg-[#0B1030] text-white shadow-[0_30px_60px_-24px_rgba(11,16,48,.45)]" : "border-2 border-[#EEF0F6] bg-white"}`}>
    {featured && <span className="absolute right-6 top-6 rounded-full bg-[#FFF6CC] px-3 py-1 text-[11px] font-semibold text-[#0B1030]">Хамгийн эрэлттэй</span>}
    <h3 className="text-xl font-medium">{name}</h3>
    <p className="mt-5 font-display text-[44px] font-medium leading-none tracking-[-0.03em]">{priceLabel}{interval && <small className={`ml-1 text-sm font-normal ${featured ? "text-slate-400" : "text-muted-foreground"}`}>/сар</small>}</p>
    <ul className="mt-6 flex-1 space-y-3 text-sm">{items.map((item) => <li key={item} className="flex items-start gap-2.5"><Check size={15} strokeWidth={3} className={`mt-0.5 shrink-0 ${featured ? "text-[#8FA3FF]" : "text-[#2B4BE8]"}`}/>{item}</li>)}</ul>
    {code === "free" ? <Link href="/register" className={buttonClass}>{cta}</Link> : <form action={startBylCheckout}><input type="hidden" name="planCode" value={code}/><button type="submit" className={buttonClass}>{cta}</button></form>}
  </article>;
}
