import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { FigmaLanding } from "@/components/home/figma-landing";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { url: "/" } };

export default async function HomePage() { return <><Navbar/><FigmaLanding/></>; }
