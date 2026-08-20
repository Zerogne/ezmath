import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialForm } from "@/components/admin/materials/material-form";
import { getAdminMaterial } from "@/lib/admin/data";
export default async function EditSatMaterialPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; const test = await getAdminMaterial(testId); if (!test || test.examType !== "SAT") notFound(); return <><AdminPageHeader title="SAT материал засах" description={test.title}/><MaterialForm examType="SAT" initial={test}/></>; }
