import type { Metadata } from "next";
import { PortalHeader, PortalShell } from "@/components/dashboard/portal-shell";
import { CourseSummary } from "@/components/dashboard/portal-views";
import { getCourseCatalog } from "@/lib/data/course-catalog";
import { getLessonProgress } from "@/lib/data/lesson-progress";
import { getPortalData } from "@/lib/data/student-portal";
import { moduleLessons } from "@/lib/learning/course-catalog";

export const metadata: Metadata = { title: "Миний хичээлүүд" };

export default async function Page() {
  const [d, { progress }, course] = await Promise.all([getPortalData(), getLessonProgress("/dashboard/courses"), getCourseCatalog()]);
  const completed = new Set(progress.filter((item) => item.completed_at).map((item) => item.lesson_id));
  const lessons = course.modules.flatMap(moduleLessons);
  const recentId = progress.find((item) => !item.completed_at)?.lesson_id;
  const next = lessons.find((item) => item.id === recentId) ?? lessons.find((item) => !completed.has(item.id));
  const summary = { title: course.title, description: course.description, modules: course.modules.reduce((sum, main) => sum + main.submodules.length, 0), lessons: lessons.length, exercises: course.exerciseCount, completed: lessons.filter((item) => completed.has(item.id)).length, nextLesson: next, href: next ? `/lesson/${course.slug}/${next.id}` : "/lesson" };
  return <PortalShell active="/dashboard/courses" plan={d.plan}><PortalHeader title="Миний хичээлүүд" description="Эхлүүлсэн хөтөлбөр, сорил болон суралцах явцаа үргэлжлүүл."/><CourseSummary course={summary} tests={d.tests} attempts={d.attempts} paid={d.plan.code !== "free"}/></PortalShell>;
}
