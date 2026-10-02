"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMaterial, setMaterialStatus } from "@/app/admin/materials/actions";
import { Badge } from "@/components/ui/shadcn/badge";
import { AdminTable } from "@/components/admin/data-table";
import { AdminRowActions, type AdminRowAction } from "@/components/admin/row-actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Test } from "@/types/exam";

type MaterialStatus = "draft" | "published" | "archived";
type AdminMaterial = Test & { status: MaterialStatus; updated: string };

export function MaterialsTable({ materials, exam }: { materials: AdminMaterial[]; exam: "sat" | "eyesh" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminMaterial | null>(null);
  const headers = exam === "sat" ? ["Гарчиг", "Хэсэг", "Төрөл", "Асуулт", "Хугацаа", "Төлөв", "Шинэчилсэн", ""] : ["Гарчиг", "Хичээл", "Он", "Асуулт", "Хугацаа", "Төлөв", "Шинэчилсэн", ""];

  const changeStatus = (id: string, status: MaterialStatus) => startTransition(async () => {
    setError("");
    const result = await setMaterialStatus(id, status);
    if (result.error) setError(result.error);
    else router.refresh();
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const material = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      setError("");
      const result = await deleteMaterial(material.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return <div>{error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}<AdminTable headers={headers}>{materials.map((material) => {
    const editHref = `/admin/materials/${exam}/${material.id}/edit`;
    const actions: AdminRowAction[] = [
      { label: "Засах", href: editHref },
      ...(material.status === "published" ? [{ label: "Тестийг нээх", href: `/tests/${material.id}` }, { label: "Draft болгох", onSelect: () => changeStatus(material.id, "draft"), disabled: pending }] : [{ label: "Нийтлэх", onSelect: () => changeStatus(material.id, "published"), disabled: pending }]),
      ...(material.status !== "archived" ? [{ label: "Archive хийх", onSelect: () => changeStatus(material.id, "archived"), disabled: pending }] : [{ label: "Draft болгож сэргээх", onSelect: () => changeStatus(material.id, "draft"), disabled: pending }]),
      { label: "Устгах", onSelect: () => setDeleteTarget(material), destructive: true, disabled: pending },
    ];
    const statusLabel = material.status === "published" ? "Published" : material.status === "archived" ? "Archived" : "Draft";
    return <tr key={material.id}><td className="px-4 py-3"><Link href={editHref} className="font-semibold hover:text-primary">{material.title}</Link></td><td className="px-4 py-3 text-muted-foreground">{material.subject}</td><td className="px-4 py-3 text-muted-foreground">{exam === "sat" ? material.type : material.year ?? "—"}</td><td className="px-4 py-3">{material.questionCount}</td><td className="px-4 py-3">{material.durationMinutes} мин</td><td className="px-4 py-3"><Badge variant={material.status === "published" ? "success" : "secondary"}>{statusLabel}</Badge></td><td className="px-4 py-3 text-muted-foreground">{material.updated}</td><td className="px-4 py-3"><AdminRowActions label={`${material.title} үйлдэл`} actions={actions} /></td></tr>;
  })}</AdminTable>
  <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>&ldquo;{deleteTarget?.title}&rdquo;-г устгах уу?</AlertDialogTitle>
        <AlertDialogDescription>Буцаах боломжгүй.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Болих</AlertDialogCancel>
        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Устгах</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  </div>;
}
