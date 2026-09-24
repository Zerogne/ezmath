import { AdminMaterialEdit } from "@/components/admin/materials/material-pages";

export default async function EditEyeshMaterialPage({ params }: { params: Promise<{ testId: string }> }) { const { testId } = await params; return <AdminMaterialEdit examType="EYESH" testId={testId}/>; }
