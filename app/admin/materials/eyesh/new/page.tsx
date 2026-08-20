import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialForm } from "@/components/admin/materials/material-form";
export default function NewEyeshMaterialPage() { return <><AdminPageHeader title="ЭЕШ материал нэмэх" description="Үндсэн мэдээлэл болон асуултуудаа оруулна уу"/><MaterialForm examType="EYESH"/></>; }
