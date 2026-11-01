"use client";
import { useActionState } from "react";
import { updateStudentProfile } from "@/app/dashboard/actions";
const initial = {};
export function SettingsForm({ name, avatarUrl }: { name: string; avatarUrl: string }) { const [state,action,pending]=useActionState(updateStudentProfile,initial); return <form action={action} className="mt-6 max-w-2xl space-y-4 rounded-2xl border bg-white p-5"><Field label="Бүтэн нэр" name="fullName" defaultValue={name}/><Field label="Профайл зургийн HTTPS холбоос" name="avatarUrl" defaultValue={avatarUrl}/><Message state={state}/><button type="submit" disabled={pending} aria-busy={pending} className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending?"Хадгалж байна…":"Өөрчлөлт хадгалах"}</button></form>; }
function Field({label,name,defaultValue=""}:{label:string;name:string;defaultValue?:string}) { return <label className="block text-sm font-medium">{label}<input name={name} defaultValue={defaultValue} required={name==="fullName"} className="mt-2 h-11 w-full rounded-xl border px-4 font-normal"/></label>; }
function Message({state}:{state:{error?:string;success?:string}}) { return state.error?<p className="mt-4 text-sm text-red-600">{state.error}</p>:state.success?<p className="mt-4 text-sm text-emerald-600">{state.success}</p>:null; }
