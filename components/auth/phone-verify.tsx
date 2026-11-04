"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MessageSquareText, Smartphone } from "lucide-react";
import { checkPhoneVerification, type PhoneChallenge, type StartResult } from "@/app/auth/phone-actions";
import { Button } from "@/components/ui/button";

/**
 * Two-step reverse-SMS check: the student enters their number, then texts the shown code to the
 * Verify.MN shortcode from that same number. The component polls the server until it confirms.
 */
export function PhoneVerify({ start, onVerified, submitLabel = "Үргэлжлүүлэх", defaultPhone = "" }: {
  start: (phone: string) => Promise<StartResult>;
  onVerified: (challenge: PhoneChallenge) => void;
  submitLabel?: string;
  defaultPhone?: string;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pending, startTransition] = useTransition();
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => { onVerifiedRef.current = onVerified; });

  useEffect(() => {
    if (!challenge) return;
    let stopped = false;
    const expiresAt = new Date(challenge.expiresAt).getTime();
    const tick = () => setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000)));
    tick();
    const clock = setInterval(tick, 1000);
    // Verify.MN asks integrators not to poll faster than every 3 seconds.
    const poll = setInterval(async () => {
      const result = await checkPhoneVerification(challenge.id).catch(() => ({ status: "pending" as const, error: undefined }));
      if (stopped) return;
      if (result.error) setError(result.error);
      if (result.status === "verified" && !result.error) { stopped = true; onVerifiedRef.current(challenge); }
      if (result.status !== "pending") { stopped = true; clearInterval(poll); clearInterval(clock); if (result.status === "expired") { setChallenge(null); setError((current) => current || "Хугацаа дууссан. Дахин оролдоно уу."); } }
    }, 3000);
    return () => { stopped = true; clearInterval(poll); clearInterval(clock); };
  }, [challenge]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await start(phone);
      if (result.error || !result.challenge) setError(result.error ?? "Алдаа гарлаа.");
      else setChallenge(result.challenge);
    });
  };

  if (challenge) {
    const minutes = Math.floor(secondsLeft / 60);
    return <div className="space-y-4">
      <div className="rounded-2xl border-2 border-[#DCE5FF] bg-[#F5F7FF] p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#2B4BE8]"><MessageSquareText size={18}/>SMS илгээж баталгаажуулна уу</p>
        <ol className="mt-4 space-y-3 text-[15px]">
          <li className="flex items-baseline gap-3"><Step n={1}/><span><b>{formatPhone(challenge.phone)}</b> дугаартай утаснаасаа</span></li>
          <li className="flex items-baseline gap-3"><Step n={2}/><span><b className="font-display text-2xl tracking-[0.12em]">{challenge.code}</b> гэж бичээд</span></li>
          <li className="flex items-baseline gap-3"><Step n={3}/><span><b className="font-display text-xl">{challenge.shortcode}</b> дугаар руу илгээнэ үү.</span></li>
        </ol>
        <a href={challenge.smsUri} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0B1030] text-sm font-semibold text-white hover:bg-[#1A2150] sm:hidden"><Smartphone size={16}/>SMS бичих</a>
        <p className="mt-4 text-xs leading-5 text-[#5B6275]">SMS-ийн үнэ 150₮ (операторын тарифаар). Өөр SIM-ээс илгээвэл баталгаажихгүй.</p>
      </div>
      <p role="status" className="flex items-center gap-2 text-sm text-[#5B6275]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#2B4BE8]"/>SMS хүлээж байна… {minutes}:{String(secondsLeft % 60).padStart(2, "0")}</p>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="button" onClick={() => { setChallenge(null); setError(""); }} className="text-sm font-semibold text-[#2B4BE8] hover:underline">Дугаар солих</button>
    </div>;
  }

  return <form onSubmit={submit} className="space-y-4">
    <label className="grid gap-1.5 text-sm font-medium">Утасны дугаар
      <span className="flex h-12 items-center rounded-xl border-2 border-[#E4E7F0] bg-white focus-within:border-[#2B4BE8]"><span className="border-r-2 border-[#E4E7F0] px-3.5 text-[15px] text-[#5B6275]">+976</span><input required inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="9911 2233" className="h-full min-w-0 flex-1 rounded-r-xl bg-transparent px-3.5 text-[15px] font-normal outline-none"/></span>
    </label>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <Button type="submit" size="lg" className="w-full" loading={pending}>{pending ? "Түр хүлээнэ үү…" : submitLabel}</Button>
  </form>;
}

function Step({ n }: { n: number }) { return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[#2B4BE8]">{n}</span>; }
export function formatPhone(phone: string) { return `${phone.slice(0, 4)} ${phone.slice(4)}`; }
