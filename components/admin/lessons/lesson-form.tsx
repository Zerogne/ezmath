"use client";

import { useActionState } from "react";
import { BookPlus } from "lucide-react";
import { createLesson, type LessonFormState } from "@/app/admin/lessons/actions";
import { coreMathCourse } from "@/lib/learning/course-catalog";

const initialState: LessonFormState = {};

export function LessonForm() {
  const [state, action, pending] = useActionState(createLesson, initialState);
  return <form action={action} className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-6">
      <section className="rounded-xl border bg-white p-5 sm:p-6"><h2 className="font-bold">Үндсэн мэдээлэл</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Хичээлийн нэр" className="sm:col-span-2"><input name="title" required minLength={3} maxLength={160} className="h-11 rounded-xl border px-3" placeholder="Жишээ: Анхны тооны тархалт"/></Field>
        <Field label="URL slug"><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="h-11 rounded-xl border px-3" placeholder="prime-number-distribution"/></Field>
        <Field label="Модуль"><select name="moduleId" required className="h-11 rounded-xl border bg-white px-3">{coreMathCourse.modules.map((item)=><option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
        <Field label="Хугацаа (минут)"><input name="durationMinutes" type="number" required min={1} max={300} defaultValue={15} className="h-11 rounded-xl border px-3"/></Field>
        <Field label="Дараалал"><input name="sortOrder" type="number" min={0} max={10000} defaultValue={100} className="h-11 rounded-xl border px-3"/></Field>
        <Field label="Товч тайлбар" className="sm:col-span-2"><textarea name="summary" required minLength={10} maxLength={1000} rows={4} className="rounded-xl border p-3" placeholder="Сурагч энэ хичээлээс юу ойлгох вэ?"/></Field>
        <Field label="Суралцах зорилгууд — мөр бүрт нэг" className="sm:col-span-2"><textarea name="objectives" required rows={4} className="rounded-xl border p-3" placeholder={"Үндсэн ойлголтыг тайлбарлах\nЖишээн дээр хэрэглэх"}/></Field>
      </div></section>
      {[1,2,3].map((index)=><section key={index} className="rounded-xl border bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-bold">Агуулгын хэсэг {index}</h2>{index>1&&<span className="text-xs text-muted-foreground">Заавал биш</span>}</div><div className="mt-4 grid gap-4"><Field label="Гарчиг"><input name={`sectionTitle${index}`} required={index===1} className="h-11 rounded-xl border px-3" placeholder="Үндсэн санаа"/></Field><Field label="Тайлбар"><textarea name={`sectionBody${index}`} required={index===1} rows={6} className="rounded-xl border p-3" placeholder="Хичээлийн дэлгэрэнгүй агуулга…"/></Field><Field label="Жишээ — заавал биш"><textarea name={`sectionExample${index}`} rows={3} className="rounded-xl border p-3 font-mono text-sm" placeholder="Ажилласан жишээ эсвэл томьёо"/></Field></div></section>)}
    </div>
    <aside><div className="sticky top-24 rounded-xl border bg-white p-5"><div className="flex items-center gap-2"><BookPlus size={18} className="text-primary"/><h2 className="font-bold">Хадгалах</h2></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Draft нь зөвхөн админд харагдана. Published бол сурагчийн сонгосон модульд шууд нэмэгдэнэ.</p><label className="mt-5 grid gap-1.5 text-sm font-medium">Төлөв<select name="status" defaultValue="draft" className="h-11 rounded-xl border bg-white px-3"><option value="draft">Draft</option><option value="published">Published</option></select></label>{state.error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700">{state.error}</p>}{state.success&&<p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{state.success}</p>}<button type="submit" disabled={pending} className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50">{pending?"Хадгалж байна…":"Хичээл нэмэх"}</button></div></aside>
  </form>;
}

function Field({label,children,className=""}:{label:string;children:React.ReactNode;className?:string}) { return <label className={`grid gap-1.5 text-sm font-medium ${className}`}>{label}{children}</label>; }
