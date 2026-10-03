"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLesson, setLessonStatus } from "@/app/admin/lessons/actions";
import { Badge } from "@/components/ui/shadcn/badge";
import { AdminTable } from "@/components/admin/data-table";
import { AdminRowActions, type AdminRowAction } from "@/components/admin/row-actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type LessonRow = { id: string; title: string; module_id: string; status: "draft" | "published"; duration_minutes: number; slug: string };

export function LessonsTable({ lessons, moduleTitles }: { lessons: LessonRow[]; moduleTitles: Record<string, string> }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LessonRow | null>(null);

  const changeStatus = (id: string, status: "draft" | "published") => startTransition(async () => {
    setError("");
    const result = await setLessonStatus(id, status);
    if (result.error) setError(result.error);
    else router.refresh();
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const lesson = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      setError("");
      const result = await deleteLesson(lesson.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return <div>
    {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
    <AdminTable headers={["Сэдэв", "Хичээл", "Хугацаа", "Төлөв", ""]}>
      {lessons.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Одоогоор сэдэв нэмээгүй байна.</td></tr>}
      {lessons.map((lesson) => {
        const editHref = `/admin/lessons/${lesson.id}/edit`;
        const actions: AdminRowAction[] = [
          { label: "Засах", href: editHref },
          ...(lesson.status === "published" ? [{ label: "Draft болгох", onSelect: () => changeStatus(lesson.id, "draft" as const), disabled: pending }] : [{ label: "Нийтлэх", onSelect: () => changeStatus(lesson.id, "published" as const), disabled: pending }]),
          { label: "Устгах", onSelect: () => setDeleteTarget(lesson), destructive: true, disabled: pending },
        ];
        return <tr key={lesson.id}>
          <td className="px-4 py-3"><Link href={editHref} className="font-semibold hover:text-primary">{lesson.title}</Link></td>
          <td className="px-4 py-3 text-muted-foreground">{moduleTitles[lesson.module_id] ?? lesson.module_id}</td>
          <td className="px-4 py-3">{lesson.duration_minutes} мин</td>
          <td className="px-4 py-3"><Badge variant={lesson.status === "published" ? "success" : "secondary"}>{lesson.status === "published" ? "Published" : "Draft"}</Badge></td>
          <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">{lesson.status === "published" && <Link href={`/lesson/theory-core/${lesson.slug}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={`${lesson.title} нээх`}><ExternalLink size={16}/></Link>}<AdminRowActions label={`${lesson.title} үйлдэл`} actions={actions}/></div></td>
        </tr>;
      })}
    </AdminTable>
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>&ldquo;{deleteTarget?.title}&rdquo;-г устгах уу?</AlertDialogTitle><AlertDialogDescription>Буцаах боломжгүй.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Болих</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Устгах</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
