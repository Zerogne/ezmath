"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock3, RefreshCw, ShieldX } from "lucide-react";
import type { TeacherVerificationStatus } from "@/lib/supabase/database.types";

export function TeacherVerificationState({ status, schoolName }: { status: Exclude<TeacherVerificationStatus, "approved">; schoolName: string }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "pending") return;
    const interval = window.setInterval(() => startTransition(() => router.refresh()), 10_000);
    return () => window.clearInterval(interval);
  }, [router, status]);

  const pending = status === "pending";
  const Icon = pending ? Clock3 : ShieldX;

  return (
    <section className="mx-auto max-w-2xl rounded-[22px] border-2 border-[#EEF0F6] bg-white px-6 py-12 text-center shadow-sm sm:px-10">
      <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${pending ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <p className="mt-6 text-xs font-semibold tracking-[.15em] text-[#2B4BE8]">БАГШИЙН ЭРХ</p>
      <h1 className="mt-2 text-2xl font-semibold">
        {pending ? "Сургуулийн баталгаажуулалт хүлээж байна" : "Багшийн хүсэлт зөвшөөрөгдсөнгүй"}
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
        {pending
          ? `${schoolName}-ийн админ таны бүртгэлийг зөвшөөрсний дараа анги, сан болон шалгалтын хэрэгслүүд шууд нээгдэнэ.`
          : `${schoolName}-ийн админ таны багшийн хүсэлтийг татгалзсан байна. Сургуулийн админтай холбогдоно уу.`}
      </p>
      {pending && (
        <button
          type="button"
          disabled={refreshing}
          onClick={() => startTransition(() => router.refresh())}
          className="mt-7 inline-flex h-11 items-center gap-2 rounded-[16px] border-2 border-[#EEF0F6] px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          {refreshing ? "Шалгаж байна…" : "Төлөв шалгах"}
        </button>
      )}
      {pending && <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">Төлөв 10 секунд тутам автоматаар шинэчлэгдэнэ.</p>}
    </section>
  );
}
