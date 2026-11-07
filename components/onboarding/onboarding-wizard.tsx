"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { saveStudentGoals } from "@/app/onboarding/actions";
import { startPhoneLink } from "@/app/auth/phone-actions";
import { PhoneVerify } from "@/components/auth/phone-verify";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Ezi, type EziPose } from "@/components/home/redesign/illustrations";
import { GOAL_RANGE, GRADE_LABELS, type StudentGoal } from "@/lib/goals";
import type { StudentGrade, TargetExam } from "@/lib/supabase/database.types";

type Placement = { id: string; title: string; questionCount: number; durationMinutes: number } | null;
type Step = "exam" | "goal" | "about" | "phone" | "done";

const EXAMS: { value: TargetExam; title: string; text: string }[] = [
  { value: "EYESH", title: "ЭЕШ", text: "Монголын их сургуулиудад элсэх" },
  { value: "SAT", title: "SAT", text: "Гадаадын их сургуульд суралцах" },
  { value: "BOTH", title: "Хоёулаа", text: "ЭЕШ болон SAT-д зэрэг бэлдэх" },
];
const HOURS = [2, 5, 8, 12, 20];
const POSE: Record<Step, EziPose> = { exam: "wave", goal: "think", about: "read", phone: "point", done: "celebrate" };

export function OnboardingWizard({ startAt, needsConsent, name, initial, editing, nextPath, phoneLinked, phoneEnabled, placement }: {
  startAt: "exam" | "phone" | "done";
  /** True for accounts (Google sign-ups) that have not accepted the terms yet. */
  needsConsent: boolean;
  name: string;
  initial: StudentGoal | null;
  editing: boolean;
  nextPath: string;
  phoneLinked: boolean;
  phoneEnabled: boolean;
  placement: Record<"EYESH" | "SAT", Placement>;
}) {
  const router = useRouter();
  const now = new Date();
  const defaultYear = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  // Both are fixed on first render so a server refresh mid-wizard (after saving goals or verifying
  // the phone) cannot move the student to another step or reshape the step list.
  const [step, setStep] = useState<Step>(startAt);
  const [askPhone] = useState(phoneEnabled && !phoneLinked);
  const [targetExam, setTargetExam] = useState<TargetExam | null>(initial?.targetExam ?? null);
  const [accepted, setAccepted] = useState(false);
  const [eyeshGoal, setEyeshGoal] = useState(initial?.eyeshGoal ?? 650);
  const [satGoal, setSatGoal] = useState(initial?.satGoal ?? 650);
  const [eyeshYear, setEyeshYear] = useState(initial?.eyeshExamYear ?? defaultYear);
  const [satMonth, setSatMonth] = useState(initial?.satExamMonth?.slice(0, 7) ?? "");
  const [grade, setGrade] = useState<StudentGrade | null>(initial?.grade ?? null);
  const [hours, setHours] = useState<number | null>(initial?.weeklyStudyHours ?? null);
  const [university, setUniversity] = useState(initial?.targetUniversity ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const steps: Step[] = editing ? ["exam", "goal", "about"] : ["exam", "goal", "about", ...(askPhone ? ["phone" as const] : []), "done"];
  const index = steps.indexOf(step);
  const wantsEyesh = targetExam !== "SAT";
  const wantsSat = targetExam !== "EYESH";
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const save = () => {
    if (!targetExam) return;
    setError("");
    startTransition(async () => {
      const result = await saveStudentGoals({ targetExam, eyeshGoal, satGoal, eyeshExamYear: eyeshYear, satExamMonth: satMonth || null, grade, weeklyStudyHours: hours, targetUniversity: university, acceptTerms: accepted });
      if (result.error) { setError(result.error); return; }
      if (editing) { router.push(nextPath); router.refresh(); return; }
      setStep(steps[index + 1]);
    });
  };

  const placements = targetExam === "BOTH" ? [placement.EYESH, placement.SAT] : [targetExam === "SAT" ? placement.SAT : placement.EYESH];

  return <main className="grid min-h-screen bg-white lg:grid-cols-[minmax(0,1fr)_480px]">
    <div className="flex flex-col px-4 py-6 sm:px-10 lg:px-16">
      <div className="flex items-center justify-between gap-4">
        <Logo size={40} className="text-xl"/>
        {editing && <Link href={nextPath} className="text-sm font-medium text-[#5B6275] hover:text-[#0B1030]">Болих</Link>}
      </div>
      <section className="mx-auto my-auto w-full max-w-xl py-10">
        <div className="mb-8 flex gap-1.5" aria-label={`Алхам ${index + 1} / ${steps.length}`}>{steps.map((item, i) => <span key={item} className={`h-1.5 flex-1 rounded-full transition ${i <= index ? "bg-[#2B4BE8]" : "bg-[#EEF0F6]"}`}/>)}</div>
        <Ezi pose={POSE[step]} size={88} className="-mb-1 -ml-2 lg:hidden"/>

        {step === "exam" && <>
          <Heading title={editing ? "Зорилгоо шинэчлэх" : `Тавтай морил${name ? `, ${name}` : ""}!`} text="Аль шалгалтад бэлдэж байна вэ? Үүнээс хамаарч сорил, зөвлөмжөө тохируулна."/>
          <div className="mt-7 grid gap-3">{EXAMS.map((exam) => <button key={exam.value} type="button" onClick={() => setTargetExam(exam.value)} aria-pressed={targetExam === exam.value} className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${targetExam === exam.value ? "border-[#2B4BE8] bg-[#F5F7FF]" : "border-[#E4E7F0] hover:border-[#C9CDDA]"}`}>
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold ${targetExam === exam.value ? "bg-[#2B4BE8] text-white" : "bg-[#F1F3F8] text-[#0B1030]"}`}>{exam.value === "BOTH" ? "+" : exam.title.slice(0, 1)}</span>
            <span className="min-w-0 flex-1"><span className="block text-[17px] font-semibold">{exam.title}</span><span className="block text-sm text-[#5B6275]">{exam.text}</span></span>
            {targetExam === exam.value && <CheckCircle2 className="text-[#2B4BE8]" size={22}/>}
          </button>)}</div>
          {needsConsent && <label className="mt-6 flex items-start gap-3 rounded-xl border-2 border-[#E4E7F0] p-3.5 text-sm leading-6"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#2B4BE8]"/><span><Link href="/terms" target="_blank" className="font-semibold text-[#2B4BE8] hover:underline">Үйлчилгээний нөхцөл</Link> болон <Link href="/privacy" target="_blank" className="font-semibold text-[#2B4BE8] hover:underline">Нууцлалын бодлого</Link>-ыг уншиж, зөвшөөрч байна. 18 нас хүрээгүй бол эцэг эх, асран хамгаалагч маань зөвшөөрсөн.</span></label>}
          <Nav onNext={() => setStep("goal")} nextDisabled={!targetExam || (needsConsent && !accepted)}/>
        </>}

        {step === "goal" && <>
          <Heading title="Зорилтот оноо" text="Хэдэн оноо авахыг зорьж байна вэ? Дараа нь хүссэн үедээ өөрчилж болно."/>
          <div className="mt-7 space-y-5">
            {wantsEyesh && <GoalCard label="ЭЕШ · Математик" range={GOAL_RANGE.EYESH} value={eyeshGoal} onChange={setEyeshGoal}>
              <label className="grid gap-1.5 text-sm font-medium">Хэдэн онд өгөх вэ?<select value={eyeshYear} onChange={(event) => setEyeshYear(Number(event.target.value))} className="h-11 rounded-xl border-2 border-[#E4E7F0] bg-white px-3 font-normal">{[0, 1, 2, 3].map((offset) => now.getFullYear() + offset).filter((year) => year >= defaultYear).map((year) => <option key={year} value={year}>{year} оны 6-р сар</option>)}</select></label>
            </GoalCard>}
            {wantsSat && <GoalCard label="SAT · Math хэсэг" range={GOAL_RANGE.SAT} value={satGoal} onChange={setSatGoal}>
              <label className="grid gap-1.5 text-sm font-medium">Хэзээ өгөх вэ? <span className="font-normal text-[#5B6275]">(мэдэхгүй бол хоосон орхино)</span><input type="month" min={thisMonth} value={satMonth} onChange={(event) => setSatMonth(event.target.value)} className="h-11 rounded-xl border-2 border-[#E4E7F0] bg-white px-3 font-normal"/></label>
            </GoalCard>}
          </div>
          <Nav onBack={() => setStep("exam")} onNext={() => setStep("about")}/>
        </>}

        {step === "about" && <>
          <Heading title="Өөрийнхөө тухай" text="Бэлтгэлийн төлөвлөгөөг тань тохируулахад тусална."/>
          <div className="mt-7 space-y-6">
            <fieldset><legend className="mb-2 text-sm font-medium">Хэддүгээр ангид сурдаг вэ?</legend><div className="flex flex-wrap gap-2">{(Object.keys(GRADE_LABELS) as StudentGrade[]).map((value) => <Pill key={value} active={grade === value} onClick={() => setGrade(value)}>{GRADE_LABELS[value]}</Pill>)}</div></fieldset>
            <fieldset><legend className="mb-2 text-sm font-medium">7 хоногт хэдэн цаг бэлдэж чадах вэ?</legend><div className="flex flex-wrap gap-2">{HOURS.map((value, i) => <Pill key={value} active={hours === value} onClick={() => setHours(value)}>{i === HOURS.length - 1 ? `${HOURS[i - 1]}+ цаг` : `~${value} цаг`}</Pill>)}</div></fieldset>
            <label className="grid gap-1.5 text-sm font-medium">Элсэхийг хүсэж буй сургууль <span className="-mt-1 font-normal text-[#5B6275]">(заавал биш)</span><input value={university} maxLength={120} onChange={(event) => setUniversity(event.target.value)} placeholder="Жишээ нь: МУИС, ШУТИС, NYU…" className="h-12 rounded-xl border-2 border-[#E4E7F0] bg-white px-3.5 font-normal placeholder:text-[#9AA0B4] focus:border-[#2B4BE8] focus:outline-none"/></label>
          </div>
          {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Nav onBack={() => setStep("goal")} onNext={save} nextLabel={editing ? "Хадгалах" : "Үргэлжлүүлэх"} loading={pending}/>
        </>}

        {step === "phone" && <>
          <Heading title="Утсаа баталгаажуулах" text="Нууц үгээ мартвал утсаараа сэргээх боломжтой болно. Таны дугаарыг өөр зорилгоор ашиглахгүй."/>
          <div className="mt-7"><PhoneVerify start={startPhoneLink} submitLabel="Код авах" onVerified={() => setStep("done")}/></div>
        </>}

        {step === "done" && <>
          <Heading title="Бүх зүйл бэлэн боллоо!" text="Эхлээд түвшин тогтоох сорил өгвөл зорилго хүртэлх зайгаа мэдэж, хаанаас эхлэхээ харна."/>
          <div className="mt-7 space-y-3">{placements.map((test) => test && <Link key={test.id} href={`/tests/${test.id}`} className="flex items-center gap-4 rounded-2xl border-2 border-[#DCE5FF] bg-[#F5F7FF] p-4 transition hover:border-[#2B4BE8]">
            <span className="min-w-0 flex-1"><span className="block text-[11px] font-bold tracking-[0.14em] text-[#2B4BE8]">ТҮВШИН ТОГТООХ СОРИЛ</span><span className="mt-1 block text-[17px] font-semibold">{test.title}</span><span className="mt-1 flex gap-3 text-xs font-medium text-[#5B6275]"><span>{test.questionCount} бодлого</span><span className="inline-flex items-center gap-1"><Clock3 size={13}/>{test.durationMinutes} мин</span></span></span>
            <ArrowRight className="text-[#2B4BE8]" size={20}/>
          </Link>)}</div>
          <Link href={nextPath} className="mt-5 block text-center text-sm font-semibold text-[#5B6275] hover:text-[#0B1030]">Дараа өгье, хянах самбар руу очих</Link>
        </>}
      </section>
    </div>
    <aside aria-hidden className="hidden flex-col items-center justify-center bg-[linear-gradient(180deg,#E8EEFF_0%,#D4E7FF_60%,#C3F0E2_100%)] px-12 lg:flex">
      <Ezi pose={POSE[step]} size={260} priority/>
      {targetExam && step !== "exam" && <div className="mt-2 w-[300px] rounded-[22px] border-2 border-[#EEF0F6] bg-white p-4 shadow-[0_24px_50px_-24px_rgba(11,16,48,.35)]">
        <p className="text-xs font-medium text-[#5B6275]">Миний зорилго</p>
        {wantsEyesh && <p className="mt-1 flex items-baseline justify-between font-display text-[28px] font-medium leading-tight">{eyeshGoal}<span className="font-sans text-[13px] font-semibold text-[#5B6275]">ЭЕШ · {eyeshYear}</span></p>}
        {wantsSat && <p className="mt-1 flex items-baseline justify-between font-display text-[28px] font-medium leading-tight">{satGoal}<span className="font-sans text-[13px] font-semibold text-[#5B6275]">SAT Math</span></p>}
      </div>}
    </aside>
  </main>;
}

function Heading({ title, text }: { title: string; text: string }) {
  return <><h1 className="text-[30px] font-medium leading-tight sm:text-[34px]">{title}</h1><p className="mt-2 text-[15px] leading-6 text-[#5B6275]">{text}</p></>;
}

function Nav({ onBack, onNext, nextDisabled, nextLabel = "Үргэлжлүүлэх", loading }: { onBack?: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel?: string; loading?: boolean }) {
  return <div className="mt-8 flex gap-3">
    {onBack && <Button variant="secondary" size="lg" onClick={onBack} aria-label="Буцах"><ArrowLeft size={18}/></Button>}
    <Button size="lg" className="flex-1" onClick={onNext} disabled={nextDisabled} loading={loading}>{loading ? "Хадгалж байна…" : nextLabel}{!loading && <ArrowRight size={18}/>}</Button>
  </div>;
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`h-11 rounded-full border-2 px-4 text-sm font-semibold transition ${active ? "border-[#2B4BE8] bg-[#2B4BE8] text-white" : "border-[#E4E7F0] bg-white hover:border-[#C9CDDA]"}`}>{children}</button>;
}

function GoalCard({ label, range, value, onChange, children }: { label: string; range: { min: number; max: number }; value: number; onChange: (value: number) => void; children: React.ReactNode }) {
  const share = (value - range.min) / (range.max - range.min);
  const level = share >= 0.8 ? "Маш өндөр зорилго" : share >= 0.6 ? "Өндөр зорилго" : share >= 0.4 ? "Дунд түвшин" : "Суурь түвшин";
  return <div className="rounded-2xl border-2 border-[#E4E7F0] p-5">
    <div className="flex items-baseline justify-between gap-3"><p className="text-sm font-semibold">{label}</p><p className="text-xs font-medium text-[#5B6275]">{level}</p></div>
    <p className="mt-2 font-display text-[44px] font-medium leading-none tracking-[-0.03em]">{value}<span className="ml-1 font-sans text-base font-medium text-[#9AA0B4]">/ 800</span></p>
    <input type="range" min={range.min} max={range.max} step={10} value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={`${label} зорилтот оноо`} className="mt-4 w-full accent-[#2B4BE8]"/>
    <div className="flex justify-between text-xs text-[#9AA0B4]"><span>{range.min}</span><span>{range.max}</span></div>
    <div className="mt-4">{children}</div>
  </div>;
}
