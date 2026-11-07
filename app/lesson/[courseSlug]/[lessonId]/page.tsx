import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonReader } from "@/components/lesson/lesson-reader";
import { allLessons, coreMathCourse } from "@/lib/learning/course-catalog";
import { getLessonProgress } from "@/lib/data/lesson-progress";
import Link from "next/link";
import { findCourseLesson, getCourseCatalog, isTrialLesson } from "@/lib/data/course-catalog";
import { hasPaidAccess } from "@/lib/payments/entitlement";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/ui/empty-state";

export function generateStaticParams() { return allLessons.map((item)=>({courseSlug:coreMathCourse.slug,lessonId:item.id})); }

type LessonPageProps = { params: Promise<{ courseSlug: string; lessonId: string }> };

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { courseSlug, lessonId } = await params;
  if (courseSlug !== coreMathCourse.slug) return { title: "Хөтөлбөр олдсонгүй" };
  const lesson = findCourseLesson(await getCourseCatalog(), lessonId);
  return { title: lesson ? `${lesson.title} — EzMath` : "Хичээл олдсонгүй", robots: { index: false, follow: false } };
}

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { courseSlug, lessonId } = await params;
  if (courseSlug !== coreMathCourse.slug) notFound();
  const course = await getCourseCatalog();
  const lesson = findCourseLesson(course, lessonId);
  if (!lesson) notFound();
  const { userId, progress } = await getLessonProgress(`/lesson/${courseSlug}/${lessonId}`);
  if (userId && !isTrialLesson(course, lessonId) && !await hasPaidAccess(userId)) {
    return <><Navbar/><main className="container-page py-16"><EmptyState heading="h1" pose="think" title="Энэ хичээл багцад багтана" text="Багцгүй эрхээр сэдэв бүрийн эхний хичээлийг үзэх боломжтой. Бүх хичээлийг үзэхийн тулд багц сонгоно уу." action={<Link href="/pricing" className="btn-dark">Багц сонгох</Link>}/></main></>;
  }
  return <LessonReader lesson={lesson} completedIds={progress.filter((item)=>item.completed_at).map((item)=>item.lesson_id)} course={course}/>;
}
