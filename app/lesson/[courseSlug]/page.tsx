import { notFound, redirect } from "next/navigation";
import { coreMathCourse } from "@/lib/learning/course-catalog";

type CoursePageProps = { params: Promise<{ courseSlug: string }> };

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseSlug } = await params;
  if (courseSlug !== coreMathCourse.slug) notFound();
  redirect("/lesson");
}
