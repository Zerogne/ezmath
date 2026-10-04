"use client";

import Link from "next/link";
import { Clock3, ExternalLink, FileText, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLesson, setLessonStatus } from "@/app/admin/lessons/actions";
import type { AdminLessonRow } from "@/lib/data/admin-lessons";
import { Badge } from "@/components/ui/shadcn/badge";
import { AdminRowActions, type AdminRowAction } from "@/components/admin/row-actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function LessonList({ lessons, emptyLabel = "Сэдэв алга байна." }: { lessons: AdminLessonRow[]; emptyLabel?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminLessonRow | null>(null);

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
    {error && <p role="alert" className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
    {lessons.length === 0 && <p className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>}
    <ol className="divide-y">
      {lessons.map((lesson, index) => {
        const editHref = `/admin/lessons/${lesson.id}/edit`;
        const actions: AdminRowAction[] = [
          { label: "Засах", href: editHref },
          lesson.status === "published"
            ? { label: "Draft болгох", onSelect: () => changeStatus(lesson.id, "draft"), disabled: pending }
            : { label: "Нийтлэх", onSelect: () => changeStatus(lesson.id, "published"), disabled: pending },
          { label: "Устгах", onSelect: () => setDeleteTarget(lesson), destructive: true, disabled: pending },
        ];
        return <li key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
          <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
          <FileText size={15} className="shrink-0 text-muted-foreground"/>
          <div className="min-w-0 flex-1">
            {lesson.builtin
              ? <span className="block truncate text-sm font-medium">{lesson.title}</span>
              : <Link href={editHref} className="block truncate text-sm font-medium hover:text-primary">{lesson.title}</Link>}
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:inline-flex"><Clock3 size={12}/>{lesson.durationMinutes} мин</span>
          {lesson.builtin
            ? <Badge variant="secondary" className="shrink-0 gap-1"><Lock size={11}/>Үндсэн</Badge>
            : <Badge variant={lesson.status === "published" ? "success" : "secondary"} className="shrink-0">{lesson.status === "published" ? "Published" : "Draft"}</Badge>}
          <div className="flex w-[72px] shrink-0 items-center justify-end gap-0.5">
            {lesson.status === "published" && <Link href={`/lesson/theory-core/${lesson.slug}`} target="_blank" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`${lesson.title} сурагчийн хуудсанд нээх`}><ExternalLink size={15}/></Link>}
            {!lesson.builtin && <AdminRowActions label={`${lesson.title} үйлдэл`} actions={actions}/>}
          </div>
        </li>;
      })}
    </ol>
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>&ldquo;{deleteTarget?.title}&rdquo;-г устгах уу?</AlertDialogTitle><AlertDialogDescription>Буцаах боломжгүй.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Болих</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Устгах</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
