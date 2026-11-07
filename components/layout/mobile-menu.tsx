"use client";

import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

/**
 * Phone menu: the icon morphs into a close button, a dimmed backdrop fades in, and the panel slides down
 * with its items staggered. Closes on a link tap, the backdrop, Escape or rotating to desktop width.
 * `top` is the header height the panel and backdrop start below.
 */
export function MobileMenu({ label, top, className = "", children }: { label: string; top: string; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  // Portals need document.body, which exists only after hydration.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => { if (desktop.matches) setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return <div className={className}>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={panelId} aria-label={open ? `${label} хаах` : `${label} нээх`} className="relative grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-[#F1F3F8] active:scale-95 motion-reduce:transition-none">
      <Menu size={22} className={`absolute transition-all duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"}`}/>
      <X size={22} className={`absolute transition-all duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}/>
    </button>
    {/* Rendered on <body>: headers use backdrop-blur, which would trap a fixed backdrop inside the header box. */}
    {mounted && createPortal(<div aria-hidden onClick={() => setOpen(false)} style={{ top }} className={`fixed inset-x-0 bottom-0 z-30 bg-[#0B1030]/25 backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:transition-none lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}/>, document.body)}
    <div
      id={panelId}
      inert={!open}
      style={{ top }}
      // A tap on any link or button inside (navigation, sign-in, sign-out) closes the menu.
      onClick={(event) => { if ((event.target as HTMLElement).closest("a, button[type=submit]")) setOpen(false); }}
      className={`mobile-menu absolute inset-x-0 z-40 origin-top border-b-2 border-[#EEF0F6] bg-white shadow-[0_24px_48px_-24px_rgba(11,16,48,.35)] transition-[opacity,transform,visibility] duration-300 [transition-timing-function:cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0"}`}
      data-open={open || undefined}
    >
      {children}
    </div>
  </div>;
}
