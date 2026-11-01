import { AdminSidebar } from "./admin-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/layout/logo";

export function AdminShell({ children, adminName, pendingPayments = 0 }: { children: React.ReactNode; adminName: string; pendingPayments?: number }) {
  return (
    <SidebarProvider>
      <AdminSidebar adminName={adminName} pendingPayments={pendingPayments} />
      <SidebarInset className="bg-[#F6F7FB]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-2 border-[#EEF0F6] bg-white px-4 lg:hidden">
          <SidebarTrigger />
          <Logo href="/admin" size={32} className="text-lg" />
          <span className="rounded-full bg-[#0B1030] px-2 py-0.5 text-[10px] font-semibold text-white">Admin</span>
        </header>
        <div className="px-4 py-7 sm:px-6 lg:px-9 lg:pb-10 lg:pt-7">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
