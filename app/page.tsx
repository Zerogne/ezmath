import type { Metadata } from "next";
import { RedesignLanding } from "@/components/home/redesign/redesign-landing";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

export default function HomePage() {
  return <RedesignLanding/>;
}
