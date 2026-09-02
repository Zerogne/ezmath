"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type AdminRowAction = { label: string; href?: string; onSelect?: () => void; destructive?: boolean; disabled?: boolean };

export function AdminRowActions({ label, actions }: { label: string; actions: AdminRowAction[] }) {
  const [position, setPosition] = useState<{ top: number; left: number }>();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = () => setPosition(undefined);
  const toggle = () => {
    if (position) { close(); return; }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 184;
    const estimatedHeight = actions.length * 40 + 16;
    const top = rect.bottom + estimatedHeight > window.innerHeight ? Math.max(8, rect.top - estimatedHeight - 4) : rect.bottom + 4;
    setPosition({ top, left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)) });
  };

  useEffect(() => {
    if (!position) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { close(); buttonRef.current?.focus(); } };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [position]);

  return <>
    <button ref={buttonRef} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={Boolean(position)} aria-controls={position ? menuId : undefined} onClick={toggle} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><MoreHorizontal size={17}/></button>
    {position && <div ref={menuRef} id={menuId} role="menu" aria-label={label} style={{ position: "fixed", top: position.top, left: position.left, width: 184 }} className="z-[100] rounded-xl border bg-white p-1.5 shadow-lg">{actions.map((action) => action.href ? (action.href.startsWith("/") ? <Link key={`${action.label}-${action.href}`} href={action.href} role="menuitem" onClick={close} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted focus:bg-muted focus:outline-none">{action.label}</Link> : <a key={`${action.label}-${action.href}`} href={action.href} role="menuitem" onClick={close} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted focus:bg-muted focus:outline-none">{action.label}</a>) : <button key={action.label} type="button" role="menuitem" disabled={action.disabled} onClick={() => { close(); action.onSelect?.(); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted focus:bg-muted focus:outline-none disabled:opacity-50 ${action.destructive ? "text-red-700" : ""}`}>{action.label}</button>)}</div>}
  </>;
}
