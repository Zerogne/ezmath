import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { LEGAL_EFFECTIVE_DATE, OPERATOR } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

/** Shared layout for the terms and privacy pages: title, table of contents, numbered sections. */
export function LegalPage({ title, intro, sections, other }: { title: string; intro: ReactNode; sections: LegalSection[]; other: { href: string; label: string } }) {
  return <>
    <Navbar/>
    <main className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-[760px]">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2B4BE8]">EzMath</p>
        <h1 className="mt-2 text-[34px] font-medium leading-tight tracking-[-0.03em] sm:text-[44px]">{title}</h1>
        <p className="mt-3 text-sm text-[#5B6275]">Хүчин төгөлдөр болсон: {LEGAL_EFFECTIVE_DATE}</p>
        <div className="mt-6 text-[16px] leading-7 text-[#3A4157]">{intro}</div>
        <nav aria-label="Агуулга" className="mt-8 rounded-[20px] border-2 border-[#EEF0F6] bg-[#F8F9FC] p-5">
          <p className="text-sm font-semibold">Агуулга</p>
          <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">{sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="text-[#2B4BE8] hover:underline">{index + 1}. {section.title}</a></li>)}</ol>
        </nav>
        <div className="mt-10 space-y-10">{sections.map((section, index) => <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="font-sans text-xl font-semibold tracking-normal">{index + 1}. {section.title}</h2>
          <div className="legal-body mt-3 space-y-3 text-[15px] leading-7 text-[#3A4157] [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{section.body}</div>
        </section>)}</div>
        <div className="mt-12 rounded-[20px] border-2 border-[#EEF0F6] p-5 text-sm leading-6 text-[#5B6275]">
          {OPERATOR.email ? <p>Асуулт, санал, хүсэлтээ <a href={`mailto:${OPERATOR.email}`} className="font-semibold text-[#2B4BE8] hover:underline">{OPERATOR.email}</a> хаягаар илгээнэ үү.</p> : <p>Асуулт, хүсэлтээ EzMath-ийн албан ёсны холбоо барих сувгаар илгээнэ үү.</p>}
          <p className="mt-2">Мөн уншина уу: <Link href={other.href} className="font-semibold text-[#2B4BE8] hover:underline">{other.label}</Link></p>
        </div>
      </div>
    </main>
    <SiteFooter/>
  </>;
}
