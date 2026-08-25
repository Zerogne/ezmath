import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonReader } from "@/components/lesson/lesson-reader";
import { allLessons, coreMathCourse, getLessonById } from "@/lib/learning/course-catalog";
import { getLessonProgress } from "@/lib/data/lesson-progress";

export function generateStaticParams() { return allLessons.map((item)=>({courseSlug:coreMathCourse.slug,lessonId:item.id})); }

type LessonPageProps = { params: Promise<{ courseSlug: string; lessonId: string }> };

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { courseSlug, lessonId } = await params;
  if (courseSlug !== coreMathCourse.slug) return { title: "Хөтөлбөр олдсонгүй" };
  const lesson = getLessonById(lessonId);
  return { title: lesson ? `${lesson.title} — EzMath` : "Хичээл олдсонгүй", robots: { index: false, follow: false } };
}

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { courseSlug, lessonId } = await params;
  if (courseSlug !== coreMathCourse.slug) notFound();
  const lesson = getLessonById(lessonId);
  if (!lesson) notFound();
  const { progress } = await getLessonProgress(`/lesson/${courseSlug}/${lessonId}`);
  return <LessonReader lesson={lesson} completedIds={progress.filter((item)=>item.completed_at).map((item)=>item.lesson_id)}/>;
}
