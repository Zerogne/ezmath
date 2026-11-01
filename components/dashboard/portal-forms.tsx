"use client";
import { useActionState } from "react";
import { updateStudentProfile } from "@/app/dashboard/actions";
import { btnSmDark, portalCard, portalInput } from "@/components/dashboard/portal-ui";

const initial = {};

export function SettingsForm({ name, avatarUrl }: { name: string; avatarUrl: string }) {
  const [state, action, pending] = useActionState(updateStudentProfile, initial);
  return <form action={action} className={`${portalCard} space-y-4 p-5 sm:p-6`}>
    <h2 className="font-sans text-lg font-semibold tracking-normal">Профайл</h2>
    <Field label="Бүтэн нэр" name="fullName" defaultValue={name}/>
    <Field label="Профайл зургийн HTTPS холбоос" name="avatarUrl" defaultValue={avatarUrl}/>
    <Message state={state}/>
    <button type="submit" disabled={pending} aria-busy={pending} className={`${btnSmDark} h-11`}>{pending ? "Хадгалж байна…" : "Өөрчлөлт хадгалах"}</button>
  </form>;
}
function Field({ label, name, defaultValue = "" }: { label: string; name: string; defaultValue?: string }) { return <label className="block text-sm font-medium">{label}<input name={name} defaultValue={defaultValue} required={name === "fullName"} className={`${portalInput} mt-2`}/></label>; }
function Message({ state }: { state: { error?: string; success?: string } }) { return state.error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : state.success ? <p className="rounded-xl bg-[#E9FBF2] p-3 text-sm text-[#15803D]">{state.success}</p> : null; }
