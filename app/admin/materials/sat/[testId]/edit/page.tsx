import { AdminMaterialEdit } from "@/components/admin/materials/material-pages";

export default async function EditSatMaterialPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; return <AdminMaterialEdit examType="SAT" testId={testId}/>; }
