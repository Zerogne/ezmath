"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Ezi } from "@/components/home/redesign/illustrations";
import { reportClientError } from "@/lib/monitoring/client";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); reportClientError(error, { boundary: "page", digest: error.digest }); }, [error]);
  return <main className="grid min-h-[70vh] place-items-center px-4 py-16 text-center"><div>
    <Ezi pose="oops" size={160} className="mx-auto block"/>
    <h1 className="mt-4 text-3xl font-medium">Алдаа гарлаа</h1>
    <p className="mx-auto mt-3 max-w-md text-[#5B6275]">Хуудсыг ачаалах үед гэнэтийн алдаа гарлаа. Дахин оролдоод болохгүй бол нүүр хуудас руу буцаарай.</p>
    <div className="mt-8 flex flex-wrap justify-center gap-2.5"><button type="button" onClick={() => retry()} className="btn-dark">Дахин оролдох</button><Link href="/" className="btn-outline">Нүүр хуудас</Link></div>
  </div></main>;
}
