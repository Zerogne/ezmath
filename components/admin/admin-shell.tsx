import { AdminSidebar } from "./admin-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export function AdminShell({ children, adminName }: { children: React.ReactNode; adminName: string }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="mr-3 lg:hidden" />
          <p className="text-sm font-semibold lg:hidden">EzMath Admin</p>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">{adminName}</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">A</span>
          </div>
        </header>
        <div className="px-4 py-7 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
