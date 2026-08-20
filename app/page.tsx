import { Navbar } from "@/components/layout/navbar";
import { FigmaLanding } from "@/components/home/figma-landing";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) { const { payment } = await searchParams; return <><Navbar/><FigmaLanding paymentStatus={payment}/></>; }
