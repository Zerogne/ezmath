import type { Metadata } from "next";
import { Inter, Noto_Serif, Onest } from "next/font/google";
import { RedesignLanding } from "@/components/home/redesign/redesign-landing";

// Temporary preview of the OnePrep-style homepage redesign: not linked anywhere and never indexed.
export const metadata: Metadata = { title: "Нүүр хуудас — шинэ загвар (preview)", robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } };

const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-onest", display: "swap" });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const notoSerif = Noto_Serif({ subsets: ["latin", "cyrillic"], weight: ["400"], variable: "--font-noto-serif", display: "swap" });

export default function HomeRedesignPreviewPage() {
  return <div className={`${onest.variable} ${inter.variable} ${notoSerif.variable}`}><RedesignLanding/></div>;
}
