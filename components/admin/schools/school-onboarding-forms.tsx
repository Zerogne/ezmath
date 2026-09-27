"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Copy, KeyRound, Plus, School } from "lucide-react";
import { createSchoolAccount, createSchoolWithManager, type SchoolCredentials, type SchoolFormState } from "@/app/admin/schools/actions";

type SchoolOption = { id: string; name: string };
const initialState: SchoolFormState = {};

export function SchoolOnboardingForm() {
  const [state, action, pending] = useActionState(createSchoolWithManager, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.credentials) formRef.current?.reset(); }, [state.credentials]);

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><School size={19} /></span>
        <div><h2 className="text-lg font-semibold">Сургууль нээх</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Сургууль болон анхны удирдлагын эрхийг нэг дор үүсгэнэ. Slug, түр нууц үг, багшийн код автоматаар бэлэн болно.</p></div>
      </div>
      <form ref={formRef} action={action} className="mt-6 space-y-5">
        <fieldset className="space-y-4">
          <legend className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">1. Сургууль</legend>
          <Field name="name" label="Сургуулийн нэр" type="text" placeholder="Жишээ сургууль" autoComplete="organization" />
        </fieldset>
        <fieldset className="space-y-4 border-t pt-5">
          <legend className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">2. Удирдлагын аккаунт</legend>
          <Field name="fullName" label="Хариуцсан хүний нэр" type="text" placeholder="Овог нэр" autoComplete="name" />
          <Field name="email" label="Нэвтрэх имэйл" type="email" placeholder="manager@school.mn" autoComplete="email" />
          <p className="flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-800"><KeyRound size={15} className="mt-0.5 shrink-0" />Аюулгүй түр нууц үгийг систем өөрөө үүсгэнэ. Амжилттай болсны дараа нэг удаа хуулж аваарай.</p>
        </fieldset>
        <ActionMessage state={state} />
        <button type="submit" disabled={pending} aria-busy={pending} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50"><Plus size={17} />{pending ? "Үүсгэж байна…" : "Сургууль ба аккаунт үүсгэх"}</button>
      </form>
      {state.credentials && <CredentialsCard credentials={state.credentials} />}
    </section>
  );
}

export function AddSchoolManagerForm({ schools }: { schools: SchoolOption[] }) {
  const [state, action, pending] = useActionState(createSchoolAccount, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.credentials) formRef.current?.reset(); }, [state.credentials]);

  return (
    <details className="rounded-2xl border bg-white p-5">
      <summary className="cursor-pointer font-semibold">Одоо байгаа сургуульд удирдлага нэмэх</summary>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Нэг сургуульд нэмэлт удирдлагын аккаунт хэрэгтэй үед ашиглана.</p>
      <form ref={formRef} action={action} className="mt-5 space-y-4">
        <Field name="fullName" label="Хариуцсан хүний нэр" type="text" autoComplete="name" />
        <Field name="email" label="Нэвтрэх имэйл" type="email" autoComplete="email" />
        <label className="grid gap-1.5 text-sm font-medium">Сургууль<select name="schoolId" required defaultValue="" className="h-11 rounded-xl border bg-white px-3 font-normal"><option value="" disabled>Сургууль сонгох</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label>
        <ActionMessage state={state} />
        <button type="submit" disabled={pending || !schools.length} aria-busy={pending} className="h-11 w-full rounded-xl border bg-white text-sm font-semibold disabled:opacity-50">{pending ? "Нэмж байна…" : "Удирдлагын эрх нэмэх"}</button>
      </form>
      {state.credentials && <CredentialsCard credentials={state.credentials} />}
    </details>
  );
}

function ActionMessage({ state }: { state: SchoolFormState }) {
  if (state.error) return <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{state.error}</p>;
  if (state.success) return <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{state.success}</p>;
  return null;
}

function CredentialsCard({ credentials }: { credentials: SchoolCredentials }) {
  return (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4" role="status">
      <div className="flex items-center gap-2 text-sm font-bold text-emerald-900"><Check size={17} />Нэвтрэх мэдээлэл бэлэн</div>
      <p className="mt-2 text-xs leading-5 text-emerald-900/75">Нууц үг дахин харагдахгүй. Хариуцсан хүнд аюулгүй сувгаар дамжуулаарай.</p>
      <div className="mt-4 space-y-2"><CopyValue label="Имэйл" value={credentials.email} /><CopyValue label="Түр нууц үг" value={credentials.temporaryPassword} secret /><CopyValue label="Багшийн код" value={credentials.teacherCode} /></div>
    </div>
  );
}

function CopyValue({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2"><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`truncate text-sm font-semibold ${secret ? "font-mono" : ""}`}>{value}</p></div><button type="button" onClick={copy} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-primary" aria-label={`${label} хуулах`}>{copied ? <Check size={15} /> : <Copy size={15} />}</button></div>;
}

function Field({ name, label, type, placeholder, autoComplete }: { name: string; label: string; type: string; placeholder?: string; autoComplete?: string }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}<input name={name} type={type} required minLength={type === "text" ? 2 : undefined} maxLength={type === "email" ? 254 : 120} placeholder={placeholder} autoComplete={autoComplete} className="h-11 rounded-xl border px-3 font-normal" /></label>;
}
