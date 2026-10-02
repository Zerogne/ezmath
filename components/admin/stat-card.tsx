import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminStatCard({ label, value, icon: Icon, note }: { label: string; value: string; icon: LucideIcon; note?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon size={17} className="text-primary" />
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-2xl font-bold">{value}</p>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}
