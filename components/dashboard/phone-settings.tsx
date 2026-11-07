"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Smartphone } from "lucide-react";
import { startPhoneLink } from "@/app/auth/phone-actions";
import { formatPhone, PhoneVerify } from "@/components/auth/phone-verify";
import { btnSmOutline, portalCard, portalMuted } from "@/components/dashboard/portal-ui";

export function PhoneSettings({ phone, enabled }: { phone: string | null; enabled: boolean }) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);
  return <section className={`${portalCard} p-5 sm:p-6`}>
    <div className="flex flex-wrap items-center gap-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#E9FBF2] text-[#15803D]"><Smartphone size={20}/></span>
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Утасны дугаар</p><p className={`mt-0.5 text-sm ${portalMuted}`}>{phone ? `${formatPhone(phone)} · баталгаажсан` : "Нууц үгээ мартвал утсаараа сэргээхийн тулд баталгаажуулна уу."}</p></div>
      {enabled && !changing && <button type="button" onClick={() => setChanging(true)} className={btnSmOutline}>{phone ? "Дугаар солих" : "Баталгаажуулах"}</button>}
    </div>
    {changing && <div className="mt-5 max-w-md"><PhoneVerify start={startPhoneLink} onVerified={() => { setChanging(false); router.refresh(); }}/></div>}
  </section>;
}
