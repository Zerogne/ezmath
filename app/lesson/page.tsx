import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { ProgramCatalog } from "@/components/lesson/program-catalog";
import { getLessonProgress } from "@/lib/data/lesson-progress";
import { getCourseCatalog } from "@/lib/data/course-catalog";

export const metadata: Metadata = { title: "Суралцах хөтөлбөрүүд", robots: { index: false, follow: false } };

export default async function LessonPage() {
  const [{ progress }, course] = await Promise.all([getLessonProgress(), getCourseCatalog()]);
  return <><Navbar/><ProgramCatalog progress={progress} course={course}/></>;
}
