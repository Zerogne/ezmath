import type { Metadata } from "next";
import { Inter, Noto_Serif, Onest } from "next/font/google";
import { RedesignLanding } from "@/components/home/redesign/redesign-landing";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-onest", display: "swap" });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const notoSerif = Noto_Serif({ subsets: ["latin", "cyrillic"], weight: ["400"], variable: "--font-noto-serif", display: "swap" });

export default function HomePage() {
  return <div className={`${onest.variable} ${inter.variable} ${notoSerif.variable}`}><RedesignLanding/></div>;
}
