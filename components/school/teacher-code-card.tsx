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
    <section className="mt-6 flex flex-col gap-4 rounded-[22px] border-2 border-[#EEF0F6] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8EEFF] text-[#2B4BE8]">
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
          <code className="min-w-40 rounded-[16px] border-2 border-[#EEF0F6] bg-muted/40 px-4 py-2.5 text-center text-sm font-bold tracking-[.12em]">
            {visible ? code : "••••-••••-••••"}
          </code>
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-[16px] border-2 border-[#EEF0F6] text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={visible ? "Кодыг нуух" : "Кодыг харах"}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button
            type="button"
            onClick={copyCode}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1030] text-white transition hover:bg-primary/90"
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
