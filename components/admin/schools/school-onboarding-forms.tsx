"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Copy, KeyRound, Plus, School } from "lucide-react";
import { createSchoolAccount, createSchoolWithManager, type SchoolCredentials, type SchoolFormState } from "@/app/admin/schools/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/shadcn/button";

type SchoolOption = { id: string; name: string };
const initialState: SchoolFormState = {};

export function SchoolOnboardingForm() {
  const [state, action, pending] = useActionState(createSchoolWithManager, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.credentials) formRef.current?.reset(); }, [state.credentials]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><School size={19} /></span>
        <div><h2 className="text-lg font-semibold">Сургууль нээх</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Сургууль болон анхны удирдлагын эрхийг нэг дор үүсгэнэ. Slug, түр нууц үг, багшийн код автоматаар бэлэн болно.</p></div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-5">
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
          <Button type="submit" disabled={pending} aria-busy={pending} className="w-full"><Plus size={17} />{pending ? "Үүсгэж байна…" : "Сургууль ба аккаунт үүсгэх"}</Button>
        </form>
        {state.credentials && <CredentialsCard credentials={state.credentials} />}
      </CardContent>
    </Card>
  );
}

export function AddSchoolManagerForm({ schools }: { schools: SchoolOption[] }) {
  const [state, action, pending] = useActionState(createSchoolAccount, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.credentials) formRef.current?.reset(); }, [state.credentials]);

  return (
    <Card>
      <details>
        <summary className="cursor-pointer p-5 font-semibold">Одоо байгаа сургуульд удирдлага нэмэх</summary>
        <CardContent className="pt-0">
          <p className="text-sm leading-6 text-muted-foreground">Нэг сургуульд нэмэлт удирдлагын аккаунт хэрэгтэй үед ашиглана.</p>
          <form ref={formRef} action={action} className="mt-5 space-y-4">
            <Field name="fullName" label="Хариуцсан хүний нэр" type="text" autoComplete="name" />
            <Field name="email" label="Нэвтрэх имэйл" type="email" autoComplete="email" />
            <div className="grid gap-1.5"><Label>Сургууль</Label><Select name="schoolId" required><SelectTrigger><SelectValue placeholder="Сургууль сонгох"/></SelectTrigger><SelectContent>{schools.map((school) => <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>)}</SelectContent></Select></div>
            <ActionMessage state={state} />
            <Button type="submit" variant="outline" disabled={pending || !schools.length} aria-busy={pending} className="w-full">{pending ? "Нэмж байна…" : "Удирдлагын эрх нэмэх"}</Button>
          </form>
          {state.credentials && <CredentialsCard credentials={state.credentials} />}
        </CardContent>
      </details>
    </Card>
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
  return <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2"><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className={`truncate text-sm font-semibold ${secret ? "font-mono" : ""}`}>{value}</p></div><Button type="button" variant="outline" size="icon" onClick={copy} aria-label={`${label} хуулах`}>{copied ? <Check size={15} /> : <Copy size={15} />}</Button></div>;
}

function Field({ name, label, type, placeholder, autoComplete }: { name: string; label: string; type: string; placeholder?: string; autoComplete?: string }) {
  return <div className="grid gap-1.5"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} required minLength={type === "text" ? 2 : undefined} maxLength={type === "email" ? 254 : 120} placeholder={placeholder} autoComplete={autoComplete} /></div>;
}
