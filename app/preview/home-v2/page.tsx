import type { Metadata } from "next";
import { Inter, Noto_Serif, Onest } from "next/font/google";
import { redirect } from "next/navigation";
import { RedesignLanding } from "@/components/home/redesign/redesign-landing";
import { getAdminIdentity } from "@/lib/admin/auth";

// Hidden preview of the OnePrep-style homepage redesign: admins only, not linked anywhere, never indexed.
export const metadata: Metadata = { title: "Нүүр хуудас — шинэ загвар (preview)", robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } };

const onest = Onest({ subsets: ["latin", "cyrillic"], weight: ["300", "400", "500", "600", "700"], variable: "--font-onest", display: "swap" });
const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const notoSerif = Noto_Serif({ subsets: ["latin", "cyrillic"], weight: ["400"], variable: "--font-noto-serif", display: "swap" });

export default async function HomeRedesignPreviewPage() {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/login?next=/preview/home-v2&reason=admin");
  return <div className={`${onest.variable} ${inter.variable} ${notoSerif.variable}`}><RedesignLanding/></div>;
}
