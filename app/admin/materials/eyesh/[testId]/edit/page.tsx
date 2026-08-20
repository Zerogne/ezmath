import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialForm } from "@/components/admin/materials/material-form";
import { getAdminMaterial } from "@/lib/admin/data";
export default async function EditEyeshMaterialPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const test = await getAdminMaterial(testId); if (!test || test.examType !== "EYESH") notFound(); return <><AdminPageHeader title="ЭЕШ материал засах" description={test.title}/><MaterialForm examType="EYESH" initial={test}/></>; }
