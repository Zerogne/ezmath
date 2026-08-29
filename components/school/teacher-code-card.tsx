"use client";

import { Check, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

export function TeacherCodeCard({ code }: { code: string | null }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="mt-6 flex flex-col gap-4 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound size={20} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold">Багш баталгаажуулах код</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Танай сургуулийн багш бүртгүүлэхдээ энэ кодыг ашиглана.
          </p>
        </div>
      </div>

      {code ? (
        <div className="flex items-center gap-2">
          <code className="min-w-40 rounded-xl border bg-muted/40 px-4 py-2.5 text-center text-sm font-bold tracking-[.12em]">
            {visible ? code : "••••-••••-••••"}
          </code>
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={visible ? "Кодыг нуух" : "Кодыг харах"}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button
            type="button"
            onClick={copyCode}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90"
            aria-label={copied ? "Код хуулагдсан" : "Код хуулах"}
          >
            {copied ? <Check size={17} /> : <Copy size={17} />}
          </button>
        </div>
      ) : (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
          Код хараахан тохируулагдаагүй байна.
        </p>
      )}
    </section>
  );
}
