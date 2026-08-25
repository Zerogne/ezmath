import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { ProgramCatalog } from "@/components/lesson/program-catalog";
import { getLessonProgress } from "@/lib/data/lesson-progress";

export const metadata: Metadata = { title: "Суралцах хөтөлбөрүүд", robots: { index: false, follow: false } };

export default async function LessonPage() {
  const { progress } = await getLessonProgress();
  return <><Navbar/><ProgramCatalog progress={progress}/></>;
}
