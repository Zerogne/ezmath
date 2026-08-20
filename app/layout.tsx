import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ezmath-rho.vercel.app"),
  applicationName: "EzMath",
  title: { default: "EzMath — SAT ба ЭЕШ бэлтгэл", template: "%s | EzMath" },
  description: "SAT болон ЭЕШ-ийн математикийн шалгалтад mock сорил, дасгал, ахицын тайлангаар бодитоор бэлдэх орчин.",
  keywords: ["EzMath", "SAT", "ЭЕШ", "математик", "mock шалгалт", "Монгол"],
  authors: [{ name: "EzMath" }],
  creator: "EzMath",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "mn_MN",
    url: "/",
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn"><body>{children}</body></html>;
}
