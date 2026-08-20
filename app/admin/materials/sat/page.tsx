import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialsTable } from "@/components/admin/materials/materials-table";
import { ButtonLink } from "@/components/ui/button";
import { listAdminMaterials } from "@/lib/admin/data";
export default async function SatMaterialsPage() { const materials = await listAdminMaterials("SAT"); return <><AdminPageHeader title="SAT материал" description="SAT шалгалт, модуль болон дасгалуудыг удирдах" action={<ButtonLink href="/admin/materials/sat/new"><Plus size={16}/>Материал нэмэх</ButtonLink>}/><div className="mt-7"><MaterialsTable exam="sat" materials={materials}/></div></>; }
