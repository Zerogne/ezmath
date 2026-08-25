import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { CourseOverview } from "@/components/lesson/course-overview";
import { getLessonProgress } from "@/lib/data/lesson-progress";
import { coreMathCourse } from "@/lib/learning/course-catalog";

type CoursePageProps = { params: Promise<{ courseSlug: string }> };

export function generateStaticParams() { return [{ courseSlug: coreMathCourse.slug }]; }

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { courseSlug } = await params;
  return { title: courseSlug === coreMathCourse.slug ? coreMathCourse.title : "Хөтөлбөр олдсонгүй", robots: { index: false, follow: false } };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseSlug } = await params;
  if (courseSlug !== coreMathCourse.slug) notFound();
  const { progress } = await getLessonProgress(`/lesson/${courseSlug}`);
  return <><Navbar/><CourseOverview progress={progress}/></>;
}
