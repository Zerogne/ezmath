import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialForm } from "@/components/admin/materials/material-form";
export default function NewSatMaterialPage() { return <><AdminPageHeader title="SAT материал нэмэх" description="Үндсэн мэдээлэл болон асуултуудаа оруулна уу"/><MaterialForm examType="SAT"/></>; }
