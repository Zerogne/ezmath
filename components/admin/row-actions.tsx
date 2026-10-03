"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type AdminRowAction = { label: string; href?: string; onSelect?: () => void; destructive?: boolean; disabled?: boolean };

export function AdminRowActions({ label, actions }: { label: string; actions: AdminRowAction[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={label} className="rounded-lg p-2 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40">
        <MoreHorizontal size={17} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.disabled}
            className={action.destructive ? "text-destructive focus:bg-destructive/10 focus:text-destructive" : undefined}
            asChild={Boolean(action.href)}
            onSelect={action.href || !action.onSelect ? undefined : (event) => {
              // Opening another overlay (e.g. a confirm dialog) synchronously from
              // here races the dropdown's own close/focus-return cycle, so run the
              // callback after the dropdown has fully closed.
              event.preventDefault();
              const callback = action.onSelect!;
              window.setTimeout(callback, 0);
            }}
          >
            {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
