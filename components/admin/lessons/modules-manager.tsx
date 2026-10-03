"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { createModule, deleteModule, type ModuleFormState } from "@/app/admin/lessons/actions";
import type { ModuleSummary } from "@/lib/data/course-catalog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/shadcn/button";
import { Badge } from "@/components/ui/shadcn/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const initialState: ModuleFormState = {};

export function ModulesManager({ title, modules, lessonCounts, parentId = null, emptyLabel = "Модуль алга байна." }: { title: string; modules: ModuleSummary[]; lessonCounts: Record<string, number>; parentId?: string | null; emptyLabel?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createModule, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ModuleSummary | null>(null);
  const [deleting, startTransition] = useTransition();
  useEffect(() => { if (state.success) { formRef.current?.reset(); router.refresh(); } }, [router, state.success]);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      setDeleteError("");
      const result = await deleteModule(target.id);
      if (result.error) setDeleteError(result.error);
      else router.refresh();
    });
  };

  return <Card>
    <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
    <CardContent>
      {modules.length === 0 && <p className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>}
      {modules.length > 0 && <div className="divide-y rounded-xl border">
        {modules.map((module) => <div key={module.id} className="flex items-center gap-3 px-4 py-3">
          <Link href={`/admin/lessons/module/${module.id}`} className="min-w-0 flex-1 hover:text-primary">
            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{module.title}</p>{module.builtin && <Badge variant="secondary">Үндсэн</Badge>}</div>
            {module.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{module.description}</p>}
          </Link>
          <span className="shrink-0 text-xs text-muted-foreground">{lessonCounts[module.id] ?? 0} сэдэв</span>
          {!module.builtin && <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={deleting} onClick={() => setDeleteTarget(module)}><Trash2 size={14}/></Button>}
          <Link href={`/admin/lessons/module/${module.id}`} className="shrink-0 text-muted-foreground hover:text-foreground"><ChevronRight size={16}/></Link>
        </div>)}
      </div>}
      {deleteError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{deleteError}</p>}
      <form ref={formRef} action={formAction} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {parentId && <input type="hidden" name="parentId" value={parentId}/>}
        <div className="grid gap-1.5"><Label>Шинэ модулийн нэр</Label><Input name="title" required minLength={3} maxLength={160} placeholder="Жишээ: Магадлал"/></div>
        <div className="grid gap-1.5"><Label>Тайлбар — заавал биш</Label><Textarea name="description" rows={1} maxLength={500} placeholder="Товч тайлбар"/></div>
        <Button type="submit" disabled={pending}><Plus size={15}/>Модуль нэмэх</Button>
      </form>
      {state.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{state.error}</p>}
      {state.success && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{state.success}</p>}
    </CardContent>
    <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>&ldquo;{deleteTarget?.title}&rdquo; модулийг устгах уу?</AlertDialogTitle><AlertDialogDescription>Буцаах боломжгүй.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Болих</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Устгах</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Card>;
}
