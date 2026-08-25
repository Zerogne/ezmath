"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
export function FinishTestDialog({ open, answered, total, marked, onClose, onConfirm }: { open: boolean; answered: number; total: number; marked: number; onClose: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocus?.focus(); };
  }, [onClose, open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="finish-title" aria-describedby="finish-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 id="finish-title" className="text-xl font-bold">Шалгалтыг дуусгах уу?</h2><p id="finish-description" className="mt-2 text-sm text-muted-foreground">Дуусгасны дараа хариултаа өөрчлөх боломжгүй.</p><dl className="mt-6 grid grid-cols-3 gap-3"><Stat label="Хариулсан" value={answered}/><Stat label="Хариулаагүй" value={total - answered}/><Stat label="Тэмдэглэсэн" value={marked}/></dl><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button ref={cancelRef} type="button" variant="secondary" onClick={onClose}>Буцаж шалгах</Button><Button type="button" variant="danger" onClick={onConfirm}>Шалгалт дуусгах</Button></div></div></div>;
}
function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-muted p-3 text-center"><dd className="text-xl font-bold">{value}</dd><dt className="mt-1 text-[11px] text-muted-foreground">{label}</dt></div>; }
