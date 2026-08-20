import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AlphaMath — SAT ба ЭЕШ бэлтгэл", template: "%s | AlphaMath" },
  description: "SAT болон ЭЕШ-ийн шалгалтад бодитоор бэлдэх орчин.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="mn"><body>{children}</body></html>;
}
