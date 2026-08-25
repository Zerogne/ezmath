import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { CourseOverview } from "@/components/lesson/course-overview";
import { getLessonProgress } from "@/lib/data/lesson-progress";
import { getCourseCatalog } from "@/lib/data/course-catalog";

export const metadata: Metadata = { title: "Онолын Математик Цөм", robots: { index: false, follow: false } };

export default async function LessonPage() {
  const [{ progress }, course] = await Promise.all([getLessonProgress(), getCourseCatalog()]);
  return <><Navbar/><CourseOverview progress={progress} course={course}/></>;
}
