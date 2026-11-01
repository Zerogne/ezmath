import type { Metadata } from "next";
import { Inter, Noto_Serif, Onest } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ezmath-rho.vercel.app"),
  applicationName: "EzMath",
  title: { default: "EzMath — SAT ба ЭЕШ бэлтгэл", template: "%s | EzMath" },
  description: "SAT болон ЭЕШ-ийн математикийн шалгалтад mock сорил, дасгал, ахицын тайлангаар бодитоор бэлдэх орчин.",
  keywords: ["EzMath", "SAT", "ЭЕШ", "математик", "mock шалгалт", "Монгол"],
  authors: [{ name: "EzMath" }],
  creator: "EzMath",
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "EzMath",
    title: "EzMath — SAT ба ЭЕШ бэлтгэл",
    description: "SAT болон ЭЕШ-ийн математикийн mock сорил, дасгал, ахицын тайлан.",
  },
  twitter: {
    card: "summary",
    title: "EzMath — SAT ба ЭЕШ бэлтгэл",
    description: "SAT болон ЭЕШ-ийн математикийн mock сорил, дасгал, ахицын тайлан.",
  },
};

const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-onest", display: "swap" });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const notoSerif = Noto_Serif({ subsets: ["latin", "cyrillic"], weight: ["400"], variable: "--font-noto-serif", display: "swap" });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn" className={`${onest.variable} ${inter.variable} ${notoSerif.variable}`}><body>{children}</body></html>;
}
