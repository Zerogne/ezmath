import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getAdminDashboardData } from "@/lib/admin/data";
import { listAdminSchools } from "@/lib/admin/schools";

export default async function AdminDashboardPage() {
  const [data, schools] = await Promise.all([getAdminDashboardData(), listAdminSchools()]);
  return <AdminDashboard data={data} schools={schools}/>;
}
