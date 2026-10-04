import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { ModuleOverview } from "@/components/lesson/module-overview";
import { coreMathCourse } from "@/lib/learning/course-catalog";
import { getLessonProgress } from "@/lib/data/lesson-progress";
import { getCourseCatalog } from "@/lib/data/course-catalog";

type ModulePageProps = { params: Promise<{ courseSlug: string; moduleId: string }> };

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
  const { courseSlug, moduleId } = await params;
  if (courseSlug !== coreMathCourse.slug) return { title: "Хөтөлбөр олдсонгүй" };
  const main = (await getCourseCatalog()).modules.find((item) => item.id === moduleId);
  return { title: main ? `${main.title} — EzMath` : "Модуль олдсонгүй", robots: { index: false, follow: false } };
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { courseSlug, moduleId } = await params;
  if (courseSlug !== coreMathCourse.slug) notFound();
  const [{ progress }, course] = await Promise.all([getLessonProgress(`/lesson/${courseSlug}/module/${moduleId}`), getCourseCatalog()]);
  const main = course.modules.find((item) => item.id === moduleId);
  if (!main) notFound();
  return <><Navbar/><ModuleOverview progress={progress} course={course} main={main}/></>;
}
