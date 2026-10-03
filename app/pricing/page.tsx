import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/home/figma-landing";
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
    <main className="py-16 lg:py-20">
      <div className="container-page text-center">
        <h1 className="mt-3 text-3xl font-bold tracking-[-.03em] sm:text-4xl">Өөрт тохирох багцаа сонго</h1>
        <p className="mt-3 text-muted-foreground">Төлбөртэй багцын эрх сар бүр сунгагдах бөгөөд хүссэн үедээ цуцлах бүрэн боломжтой.</p>
      </div>
      {payment && paymentMessages[payment] && <p role="alert" className="container-page mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{paymentMessages[payment]}</p>}
      <div className="container-page mt-10 grid items-stretch gap-5 lg:grid-cols-3">{plans.map((plan) => <PlanCard key={plan.code} {...plan}/>)}</div>
    </main>
    <Footer/>
  </>;
}

function PlanCard({ code, name, priceLabel, interval, items, cta, featured = false }: (typeof plans)[number]) {
  const buttonClass = `mt-7 inline-flex w-full justify-center rounded-xl py-3.5 text-sm font-semibold ${featured ? "bg-primary text-white" : "bg-primary/10 text-primary"}`;
  return <article className={`relative flex flex-col rounded-2xl p-7 ${featured ? "bg-[#0b1030] text-white shadow-xl" : "border bg-white"}`}>
    {featured && <span className="absolute right-6 top-6 rounded-full bg-amber-100 px-3 py-1 text-[11px] text-[#0b1030]">Хамгийн эрэлттэй</span>}
    <h3 className="text-lg font-semibold">{name}</h3>
    <p className="mt-5 text-4xl font-bold">{priceLabel}{interval && <small className={`ml-1 text-sm font-normal ${featured ? "text-slate-400" : "text-muted-foreground"}`}>/сар</small>}</p>
    <ul className="mt-6 flex-1 space-y-3 text-sm">{items.map((item) => <li key={item} className="flex items-start gap-2.5"><Check size={15} className={`mt-0.5 shrink-0 ${featured ? "text-emerald-400" : "text-primary"}`}/>{item}</li>)}</ul>
    {code === "free" ? <Link href="/register" className={buttonClass}>{cta}</Link> : <form action={startBylCheckout}><input type="hidden" name="planCode" value={code}/><button type="submit" className={buttonClass}>{cta}</button></form>}
  </article>;
}
