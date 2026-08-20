import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialsTable } from "@/components/admin/materials/materials-table";
import { ButtonLink } from "@/components/ui/button";
import { listAdminMaterials } from "@/lib/admin/data";
export default async function EyeshMaterialsPage() { const materials = await listAdminMaterials("EYESH"); return <><AdminPageHeader title="ЭЕШ материал" description="ЭЕШ-ийн өмнөх оны материал болон дасгалуудыг удирдах" action={<ButtonLink href="/admin/materials/eyesh/new"><Plus size={16}/>Материал нэмэх</ButtonLink>}/><div className="mt-7"><MaterialsTable exam="eyesh" materials={materials}/></div></>; }
