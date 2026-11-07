"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { resetPasswordWithPhone, startPasswordReset, type PhoneChallenge } from "@/app/auth/phone-actions";
import { PhoneVerify } from "@/components/auth/phone-verify";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Ezi } from "@/components/home/redesign/illustrations";
import { OPERATOR } from "@/lib/legal";

const input = "h-12 rounded-xl border-2 border-[#E4E7F0] bg-white px-3.5 font-normal placeholder:text-[#9AA0B4] focus:border-[#2B4BE8] focus:outline-none";

export function ForgotPassword({ enabled }: { enabled: boolean }) {
  const [verified, setVerified] = useState<PhoneChallenge | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (formData: FormData) => {
    if (!verified) return;
    setError("");
    startTransition(async () => {
      // On success the action redirects, so a returned value always carries an error.
      const result = await resetPasswordWithPhone(verified.id, String(formData.get("password") ?? ""), String(formData.get("confirm") ?? ""));
      if (result?.error) setError(result.error);
    });
  };

  return <main className="flex min-h-screen flex-col bg-white px-4 py-6 sm:px-10">
    <div className="flex items-center justify-between gap-4"><Logo size={40} className="text-xl"/><Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-[#5B6275] hover:text-[#0B1030]"><ArrowLeft size={16}/>Нэвтрэх рүү буцах</Link></div>
    <section className="mx-auto my-auto w-full max-w-md py-10">
      <Ezi pose={verified ? "happy" : "think"} size={88} className="-mb-1 -ml-2"/>
      <h1 className="text-[32px] font-medium leading-tight">{verified ? "Шинэ нууц үг" : "Нууц үгээ мартсан уу?"}</h1>
      <p className="mt-2 text-[15px] leading-6 text-[#5B6275]">{verified ? "Дугаар баталгаажлаа. Шинэ нууц үгээ оруулна уу." : "Бүртгэлдээ баталгаажуулсан утасны дугаараараа нууц үгээ сэргээнэ."}</p>
      <div className="mt-7">{!enabled
        ? <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">Нууц үг сэргээх үйлчилгээ түр идэвхгүй байна. Бидэнтэй холбогдоно уу.</p>
        : verified
          ? <form action={submit} className="space-y-4">
            <label className="grid gap-1.5 text-sm font-medium">Шинэ нууц үг<input required minLength={8} name="password" type="password" autoComplete="new-password" placeholder="8-аас дээш тэмдэгт" className={input}/></label>
            <label className="grid gap-1.5 text-sm font-medium">Нууц үг давтах<input required minLength={8} name="confirm" type="password" autoComplete="new-password" className={input}/></label>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={pending}>{pending ? "Хадгалж байна…" : "Нууц үг солих"}</Button>
          </form>
          : <PhoneVerify start={startPasswordReset} submitLabel="Код авах" onVerified={setVerified}/>}</div>
      <p className="mt-6 text-center text-sm text-muted-foreground">Утсаа баталгаажуулаагүй бол <a href={`mailto:${OPERATOR.email}`} className="font-semibold text-primary hover:underline">{OPERATOR.email}</a> хаягаар бидэнд бичээрэй.</p>
    </section>
  </main>;
}
