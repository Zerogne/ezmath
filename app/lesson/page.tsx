import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { CourseOverview } from "@/components/lesson/course-overview";
import { getLessonProgress } from "@/lib/data/lesson-progress";

export const metadata: Metadata = { title: "Онолын Математик Цөм", robots: { index: false, follow: false } };

export default async function LessonPage() {
  const { progress } = await getLessonProgress();
  return <><Navbar/><CourseOverview progress={progress}/></>;
}
