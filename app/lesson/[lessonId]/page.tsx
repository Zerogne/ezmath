import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonReader } from "@/components/lesson/lesson-reader";
import { allLessons, getLessonById } from "@/lib/learning/course-catalog";
import { getLessonProgress } from "@/lib/data/lesson-progress";

export function generateStaticParams() { return allLessons.map((item)=>({lessonId:item.id})); }

type LessonPageProps = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);
  return { title: lesson ? `${lesson.title} — EzMath` : "Хичээл олдсонгүй", robots: { index: false, follow: false } };
}

export default async function LessonDetailPage({ params }: LessonPageProps) {
  const { lessonId } = await params;
  const lesson = getLessonById(lessonId);
  if (!lesson) notFound();
  const { progress } = await getLessonProgress(`/lesson/${lessonId}`);
  return <LessonReader lesson={lesson} completedIds={progress.filter((item)=>item.completed_at).map((item)=>item.lesson_id)}/>;
}
