import type { Metadata } from "next";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { getStudentDashboard } from "@/lib/data/student-dashboard";

export const metadata: Metadata = { title: "Сурагчийн хяналтын самбар" };

export default async function DashboardPage() {
  const data = await getStudentDashboard();
  return <StudentDashboard data={data}/>;
}
