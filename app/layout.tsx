import type { Metadata } from "next";
import { Inter, Noto_Serif, Onest } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { ErrorReporter } from "@/components/monitoring/error-reporter";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "EzMath",
  title: { default: "EzMath — ЭЕШ ба SAT математикийн бэлтгэл", template: "%s | EzMath" },
  description: SITE_DESCRIPTION,
  keywords: ["ЭЕШ", "ЭЕШ математик", "ЭЕШ хариу", "ЭЕШ өмнөх оны хувилбар", "ЭЕШ бэлтгэл", "SAT", "SAT Math", "математик", "mock шалгалт", "EzMath"],
  authors: [{ name: "EzMath" }],
  creator: "EzMath",
  openGraph: {
    type: "website",
    locale: "mn_MN",
    siteName: "EzMath",
    title: "EzMath — ЭЕШ ба SAT математикийн бэлтгэл",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "EzMath — ЭЕШ ба SAT математикийн бэлтгэл",
    description: SITE_DESCRIPTION,
  },
};

const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-onest", display: "swap" });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const notoSerif = Noto_Serif({ subsets: ["latin", "cyrillic"], weight: ["400"], variable: "--font-noto-serif", display: "swap" });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn" className={`${onest.variable} ${inter.variable} ${notoSerif.variable}`}><body><ErrorReporter/>{children}</body></html>;
}
