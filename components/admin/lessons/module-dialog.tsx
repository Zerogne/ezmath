"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createModule, deleteModule, updateModule, type ModuleFormState } from "@/app/admin/lessons/actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AdminRowActions } from "@/components/admin/row-actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button, type ButtonProps } from "@/components/ui/shadcn/button";

type EditableModule = { id: string; title: string; description: string };
type DialogTarget = { kind: "create"; parent?: { id: string; title: string } } | { kind: "edit"; module: EditableModule; isSubmodule: boolean };

const initialState: ModuleFormState = {};

/** Button that opens the create dialog. Pass `parent` to create a submodule inside that main module. */
export function NewModuleButton({ parent, label, variant, size }: { parent?: { id: string; title: string }; label?: string; variant?: ButtonProps["variant"]; size?: ButtonProps["size"] }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button type="button" variant={variant} size={size} onClick={() => setOpen(true)}><Plus size={16}/>{label ?? (parent ? "Дэд модуль нэмэх" : "Модуль нэмэх")}</Button>
    <ModuleDialog open={open} onOpenChange={setOpen} target={{ kind: "create", parent }}/>
  </>;
}

/** "…" menu for a custom module: rename/describe or delete. Built-in modules render nothing. `redirectTo` is where to go after deleting the module whose page you are on. */
export function ModuleMenu({ module, isSubmodule, builtin, redirectTo }: { module: EditableModule; isSubmodule: boolean; builtin: boolean; redirectTo?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  if (builtin) return null;
  const noun = isSubmodule ? "дэд модулийг" : "модулийг";

  const confirmDelete = () => {
    setConfirming(false);
    startTransition(async () => {
      setError("");
      const result = await deleteModule(module.id);
      if (result.error) setError(result.error);
      else if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  };

  return <div className="relative flex items-center">
    <AdminRowActions label={`${module.title} үйлдэл`} actions={[
      { label: "Нэр, тайлбар засах", onSelect: () => setEditing(true), disabled: pending },
      { label: "Устгах", onSelect: () => setConfirming(true), destructive: true, disabled: pending },
    ]}/>
    <ModuleDialog open={editing} onOpenChange={setEditing} target={{ kind: "edit", module, isSubmodule }}/>
    <AlertDialog open={confirming} onOpenChange={setConfirming}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>&ldquo;{module.title}&rdquo; {noun} устгах уу?</AlertDialogTitle><AlertDialogDescription>{isSubmodule ? "Дотор нь сэдэв байвал устгах боломжгүй." : "Дотор нь дэд модуль байвал устгах боломжгүй."} Буцаах боломжгүй.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Болих</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Устгах</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={Boolean(error)} onOpenChange={(open) => !open && setError("")}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Устгах боломжгүй</AlertDialogTitle><AlertDialogDescription>{error}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Ойлголоо</AlertDialogCancel></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}

function ModuleDialog({ open, onOpenChange, target }: { open: boolean; onOpenChange: (open: boolean) => void; target: DialogTarget }) {
  const isSubmodule = target.kind === "create" ? Boolean(target.parent) : target.isSubmodule;
  const title = target.kind === "edit" ? (isSubmodule ? "Дэд модуль засах" : "Модуль засах") : isSubmodule ? "Шинэ дэд модуль" : "Шинэ модуль";
  const description = target.kind === "create" && target.parent
    ? <>&ldquo;{target.parent.title}&rdquo; модуль дотор нэмэгдэнэ. Сэдвүүдээ дараа нь энэ дэд модульд нэмнэ.</>
    : target.kind === "create" ? "Үндсэн модуль нь дэд модулиудыг агуулна. Жишээ: Алгебр → Квадрат тэгшитгэл → сэдвүүд." : "Сурагчдад харагдах нэр болон тайлбарыг шинэчилнэ.";
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
      {/* Mounted only while open, so each opening starts with a fresh form state. */}
      {open && <ModuleForm target={target} onDone={() => onOpenChange(false)}/>}
    </DialogContent>
  </Dialog>;
}

function ModuleForm({ target, onDone }: { target: DialogTarget; onDone: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(target.kind === "edit" ? updateModule : createModule, initialState);
  useEffect(() => { if (state.success) { onDone(); router.refresh(); } }, [onDone, router, state.success]);
  const current = target.kind === "edit" ? target.module : undefined;
  return <form action={formAction} className="grid gap-4">
    {current && <input type="hidden" name="moduleId" value={current.id}/>}
    {target.kind === "create" && target.parent && <input type="hidden" name="parentId" value={target.parent.id}/>}
    <div className="grid gap-1.5"><Label htmlFor="module-title">Нэр</Label><Input id="module-title" name="title" required minLength={3} maxLength={160} autoFocus defaultValue={current?.title} placeholder={target.kind === "create" && target.parent ? "Жишээ: Квадрат тэгшитгэл" : "Жишээ: Алгебр"}/></div>
    <div className="grid gap-1.5"><Label htmlFor="module-description">Тайлбар <span className="font-normal text-muted-foreground">— заавал биш</span></Label><Textarea id="module-description" name="description" rows={3} maxLength={500} defaultValue={current?.description} placeholder="Сурагч энэ хэсгээс юу сурах вэ?"/></div>
    {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{state.error}</p>}
    <DialogFooter className="gap-2 sm:gap-0">
      <Button type="button" variant="outline" onClick={onDone}>Болих</Button>
      <Button type="submit" disabled={pending}>{pending ? "Хадгалж байна…" : current ? "Хадгалах" : "Нэмэх"}</Button>
    </DialogFooter>
  </form>;
}
