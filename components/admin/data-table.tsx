import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table";

/** Admin list table in the Figma admin style: white rounded card, muted small headers, soft row dividers. */
export function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[22px] border-2 border-[#EEF0F6] bg-white [&_tbody_tr]:border-b-2 [&_tbody_tr]:border-[#F4F5FA] [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-[#FAFBFD] [&_td]:text-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-[#F0F1F6] hover:bg-transparent">
            {headers.map((header) => <TableHead key={header} className="h-12 whitespace-nowrap px-4 text-xs font-semibold text-[#9AA0B4]">{header}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  );
}
