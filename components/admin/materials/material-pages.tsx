import { Plus } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MaterialForm } from "@/components/admin/materials/material-form";
import { MaterialsTable } from "@/components/admin/materials/materials-table";
import { ButtonLink } from "@/components/ui/button";
import { getAdminMaterial, listAdminMaterials } from "@/lib/admin/data";
import type { ExamType } from "@/types/exam";

const copy = {
  SAT: {
    slug: "sat",
    label: "SAT",
    description: "SAT шалгалт, модуль болон дасгалуудыг удирдах",
  },
  EYESH: {
    slug: "eyesh",
    label: "ЭЕШ",
    description: "ЭЕШ-ийн өмнөх оны материал болон дасгалуудыг удирдах",
  },
} as const;

export async function AdminMaterialsIndex({ examType }: { examType: ExamType }) {
  const materials = await listAdminMaterials(examType);
  const current = copy[examType];
  return <><AdminPageHeader title={`${current.label} материал`} description={current.description} action={<ButtonLink href={`/admin/materials/${current.slug}/new`}><Plus size={16}/>Материал нэмэх</ButtonLink>}/><div className="mt-7"><MaterialsTable exam={current.slug} materials={materials}/></div></>;
}

export async function AdminMaterialEdit({ examType, testId }: { examType: ExamType; testId: string }) {
  const test = await getAdminMaterial(testId);
  if (!test || test.examType !== examType) notFound();
  return <><AdminPageHeader title={`${copy[examType].label} материал засах`} description={test.title}/><MaterialForm examType={examType} initial={test}/></>;
}

export function AdminMaterialCreate({ examType }: { examType: ExamType }) {
  return <><AdminPageHeader title={`${copy[examType].label} материал нэмэх`} description="Үндсэн мэдээлэл болон асуултуудаа оруулна уу"/><MaterialForm examType={examType}/></>;
}
