import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";

export function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => <TableHead key={header} className="whitespace-nowrap">{header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
