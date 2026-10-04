"use client";

import { useActionState, useState } from "react";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { changeSchoolAdminPassword, type PasswordFormState } from "@/app/school/actions";
import { Button } from "@/components/ui/button";

const initialState: PasswordFormState = {};

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // React resets the uncontrolled current-password field after the action; the controlled ones are cleared here.
  const [state, formAction, pending] = useActionState(async (previous: PasswordFormState, formData: FormData) => {
    const result = await changeSchoolAdminPassword(previous, formData);
    if (result.success) { setNewPassword(""); setConfirmPassword(""); }
    return result;
  }, initialState);

  const rules = [
    { ok: newPassword.length >= 8, label: "Дор хаяж 8 тэмдэгт" },
    { ok: /[A-Za-zА-Яа-яӨөҮүЁё]/.test(newPassword) && /\d/.test(newPassword), label: "Үсэг болон тоо агуулсан" },
    { ok: Boolean(newPassword) && newPassword === confirmPassword, label: "Давтан оруулсан нь таарч байна" },
  ];

  return <form action={formAction} className="space-y-4">
    <PasswordField name="currentPassword" label="Одоогийн нууц үг" autoComplete="current-password"/>
    <PasswordField name="newPassword" label="Шинэ нууц үг" autoComplete="new-password" value={newPassword} onChange={setNewPassword}/>
    <PasswordField name="confirmPassword" label="Шинэ нууц үг давтах" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword}/>
    <ul className="grid gap-1.5 text-xs">{rules.map((rule) => <li key={rule.label} className={`flex items-center gap-2 ${rule.ok ? "text-emerald-700" : "text-muted-foreground"}`}><span className={`grid h-4 w-4 place-items-center rounded-full ${rule.ok ? "bg-emerald-100" : "bg-muted"}`}>{rule.ok && <Check size={11}/>}</span>{rule.label}</li>)}</ul>
    {state.error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.success}</p>}
    <Button type="submit" loading={pending} disabled={!rules.every((rule) => rule.ok)}><KeyRound size={16}/>{pending ? "Солиж байна…" : "Нууц үг солих"}</Button>
  </form>;
}

function PasswordField({ name, label, autoComplete, value, onChange }: { name: string; label: string; autoComplete: string; value?: string; onChange?: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return <label className="grid gap-1.5 text-sm font-medium">{label}
    <span className="relative">
      <input name={name} type={visible ? "text" : "password"} required autoComplete={autoComplete} maxLength={72} {...(onChange ? { value, onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value) } : {})} className="h-11 w-full rounded-xl border bg-white pl-3 pr-11 text-sm"/>
      <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Нууц үг нуух" : "Нууц үг харах"} className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">{visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
    </span>
  </label>;
}
