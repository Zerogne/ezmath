"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Check, Copy, MessageSquareText, Send, Smartphone } from "lucide-react";
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

  if (challenge) return <SmsInstructions challenge={challenge} secondsLeft={secondsLeft} error={error} onBack={() => { setChallenge(null); setError(""); }}/>;

  return <form onSubmit={submit} className="space-y-4">
    <label className="grid gap-1.5 text-sm font-medium">Утасны дугаар
      <span className="flex h-12 items-center overflow-hidden rounded-xl border-2 border-[#E4E7F0] bg-white transition focus-within:border-[#2B4BE8]">
        <span className="flex h-full items-center gap-1.5 border-r-2 border-[#E4E7F0] bg-[#F7F8FC] px-3.5 text-[15px] font-medium text-[#5B6275]"><Smartphone size={16}/>+976</span>
        <input required inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="9911 2233" className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-[16px] font-normal tracking-wide outline-none placeholder:text-[#9AA0B4]"/>
      </span>
    </label>
    {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
    <Button type="submit" size="lg" className="w-full" loading={pending}>{pending ? "Түр хүлээнэ үү…" : submitLabel}</Button>
  </form>;
}

function SmsInstructions({ challenge, secondsLeft, error, onBack }: { challenge: PhoneChallenge; secondsLeft: number; error: string; onBack: () => void }) {
  // Length of the session when it was shown, so the ring empties from full to zero.
  const [duration] = useState(() => Math.max(60, Math.round((new Date(challenge.expiresAt).getTime() - Date.now()) / 1000)));
  const minutes = Math.floor(secondsLeft / 60);
  const clock = `${minutes}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const ring = 2 * Math.PI * 16;

  return <div className="space-y-4">
    <section className="overflow-hidden rounded-[22px] border-2 border-[#EEF0F6] bg-white">
      <div className="flex items-center gap-3 border-b-2 border-[#F1F3F8] bg-[#F7F8FC] px-4 py-3.5 sm:px-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#E8EEFF] text-[#2B4BE8]"><MessageSquareText size={20}/></span>
        <div className="min-w-0"><p className="text-[15px] font-semibold leading-tight">SMS-ээр баталгаажуулах</p><p className="mt-0.5 text-xs text-[#5B6275]">Доорх кодыг утаснаасаа илгээнэ үү</p></div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9AA0B4]">Таны код</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1.5 sm:gap-2" aria-label={`Код ${challenge.code}`}>{challenge.code.split("").map((digit, index) => <span key={index} className="grid h-12 flex-1 place-items-center rounded-xl border-2 border-[#DCE5FF] bg-[#F5F7FF] font-display text-2xl font-medium text-[#0B1030] sm:h-14 sm:text-[28px]">{digit}</span>)}</div>
          <CopyButton value={challenge.code} label="Код хуулах"/>
        </div>

        <dl className="mt-4 divide-y-2 divide-[#F1F3F8] rounded-2xl border-2 border-[#F1F3F8]">
          <div className="flex items-center gap-3 px-3.5 py-3"><dt className="w-20 shrink-0 text-xs font-medium text-[#5B6275]">Хэнээс</dt><dd className="min-w-0 flex-1"><p className="font-semibold tracking-wide">{formatPhone(challenge.phone)}</p><p className="text-xs text-[#9AA0B4]">Энэ дугаартай SIM-ээс</p></dd></div>
          <div className="flex items-center gap-3 px-3.5 py-3"><dt className="w-20 shrink-0 text-xs font-medium text-[#5B6275]">Хэнд</dt><dd className="min-w-0 flex-1"><p className="font-display text-xl font-medium tracking-wide">{challenge.shortcode}</p></dd><CopyButton value={challenge.shortcode} label="Дугаар хуулах"/></div>
        </dl>

        <a href={challenge.smsUri} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0B1030] text-[15px] font-semibold text-white transition hover:bg-[#1A2150] active:scale-[.98] md:hidden"><Send size={17}/>SMS бичих</a>
        <p className="mt-3 text-xs leading-5 text-[#5B6275] md:mt-4">{"Утсан дээрээ \"SMS бичих\" товчийг дарвал код автоматаар бөглөгдөнө."}<span className="hidden md:inline"> Компьютер ашиглаж байгаа бол утаснаасаа гараар илгээнэ үү.</span> Өөр SIM-ээс илгээвэл баталгаажихгүй.</p>
      </div>

      <div className="flex items-center gap-3 border-t-2 border-[#F1F3F8] px-4 py-3 sm:px-5" role="status" aria-live="polite">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center">
          <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden><circle cx="20" cy="20" r="16" fill="none" stroke="#EEF0F6" strokeWidth="4"/><circle cx="20" cy="20" r="16" fill="none" stroke="#2B4BE8" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${ring * Math.min(1, secondsLeft / duration)} ${ring}`} className="transition-[stroke-dasharray] duration-1000 ease-linear"/></svg>
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#2B4BE8]"/>
        </span>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold">SMS хүлээж байна…</p><p className="text-xs text-[#5B6275]">Ирмэгц автоматаар баталгаажна · {clock} үлдсэн</p></div>
      </div>
    </section>

    {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
    <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5B6275] transition hover:text-[#0B1030]"><ArrowLeft size={15}/>Дугаар солих</button>
  </div>;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked: nothing to do */ }
  };
  return <button type="button" onClick={copy} aria-label={label} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 transition ${copied ? "border-[#BBF7D0] bg-[#E9FBF2] text-[#15803D]" : "border-[#E3E6EF] text-[#5B6275] hover:border-[#C9CDDA] hover:text-[#0B1030]"}`}>{copied ? <Check size={17}/> : <Copy size={17}/>}</button>;
}

export function formatPhone(phone: string) { return `${phone.slice(0, 4)} ${phone.slice(4)}`; }
